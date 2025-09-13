import type { Response } from "express";
import Coupon from "../models/coupon.model.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const getCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // find all active coupons for the user
    const coupon = await Coupon.findOne({ userId: user._id, isActive: true });

    res.status(200).json(coupon || null);
  } catch (error) {
    console.error("Error getting coupon:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const validadeCoupon = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const coupon = await Coupon.findOne({
      code,
      userId: user._id,
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // check if coupon is expired
    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }

    res.status(200).json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};
