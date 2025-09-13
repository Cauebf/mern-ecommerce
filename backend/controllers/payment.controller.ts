import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import Coupon from "../models/coupon.model.js";
import { stripe } from "../lib/stripe.js";
import type mongoose from "mongoose";
import Order from "../models/order.model.js";

async function createStripeCoupon(discountPercentage: number) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once", // will be valid only once
  });

  return coupon.id;
}

async function createNewCoupon(userId: mongoose.Schema.Types.ObjectId) {
  // delete old coupon for the user
  await Coupon.findOneAndDelete({ userId });

  // create new coupon for the user in the database
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(), // generate random coupon code
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    userId,
  });

  await newCoupon.save();
  return newCoupon;
}

export const createCheckoutSession = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { products, couponCode } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // check if products is an array and not empty
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // stripe expects amount in cents, so multiply by 100
      totalAmount += amount * product.quantity; // calculate total amount based on quantity and price of each product

      // return line item for stripe checkout session
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;

    // check if user has a valid coupon code and apply it if found
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: user._id,
        isActive: true,
      });

      if (coupon) {
        totalAmount -= Math.round(
          totalAmount * (coupon.discountPercentage / 100)
        );
      }
    }

    // create stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
        : [],
      metadata: {
        userId: user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((product) => ({
            id: product._id,
            quantity: product.quantity,
            price: product.price,
          }))
        ),
      },
    });

    // create new coupon for user if total amount is greater than or equal to $200 (20000 cents)
    if (totalAmount >= 20000) {
      await createNewCoupon(user._id);
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const checkoutSuccess = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId); // retrieve stripe checkout session by id

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    // check if payment is successful
    if (session.payment_status === "paid") {
      // check if order already exists
      const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
      if (existingOrder) {
        return res.status(200).json({ orderId: existingOrder._id });
      }

      // update coupon in database to inactive so it can't be used again by the user
      if (session.metadata?.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          {
            isActive: false,
          }
        );
      }

      // create a new Order document in the database
      const products = JSON.parse(session.metadata?.products || "[]") as {
        id: string;
        quantity: number;
        price: number;
      }[];
      const newOrder = new Order({
        user: session.metadata?.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total! / 100, // stripe returns amount in cents, so divide by 100 to get amount in dollars
        stripeSessionId: sessionId,
      });

      await newOrder.save();

      res.status(200).json({
        success: true,
        message:
          "Payment successful, order created, and coupon deactivated if used",
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    console.error("Error processing checkout success:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};
