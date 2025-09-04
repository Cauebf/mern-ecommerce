import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import Product from "../models/product.model.js";

export const getCartProducts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // find all products in user's cart
    const products = await Product.find({
      _id: { $in: user.cartItems.map((item) => item.product) },
    });

    // add quantity field to each product
    const cartItems = products.map((product) => {
      // find individual item in user's cart
      const item = user.cartItems.find(
        (item) => item.product?.toString() === product._id.toString()
      );

      // return product with its quantity
      return {
        ...product.toJSON(),
        quantity: item?.quantity,
      };
    });

    res.status(200).json({ cartItems });
  } catch (error) {
    console.error("Error getting cart products:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // check if product already exists in cart
    const existingItem = user.cartItems.find(
      (item) => item.product?.toString() === productId.toString() // convert ObjectId to string
    );

    if (existingItem) {
      // if product already exists in cart, increment quantity
      existingItem.quantity += 1;
    } else {
      // if product doesn't exist in cart, add it
      user.cartItems.push({
        product: productId,
        quantity: 1,
      });
    }

    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.error("Error adding to cart:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const removeAllFromCart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!productId) {
      // if productId is not provided, remove all items
      user.cartItems = [];
    } else {
      // if productId is provided, remove only the specific item
      user.cartItems = user.cartItems.filter(
        // filter out the item
        (item) => item.product?.toString() !== productId.toString()
      );
    }

    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.error("Error removing from cart:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const updateQuantity = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // check if product already exists in cart
    const existingItem = user.cartItems.find(
      (item) => item.product?.toString() === productId?.toString()
    );

    if (!existingItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (quantity <= 0) {
      // if quantity provided is less than or equal to 0, remove the item
      user.cartItems = user.cartItems.filter(
        // filter out the item
        (item) => item.product?.toString() !== productId?.toString()
      );
      await user.save();
      return res.status(200).json(user.cartItems);
    }

    // if quantity provided is greater than 0, update the quantity
    existingItem.quantity = quantity;
    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.error("Error updating quantity:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};
