import express from "express";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { getCoupon, validadeCoupon } from "../controllers/coupon.controller.js";

const router = express.Router();

router.get("/", protectedRoute, getCoupon);
router.get("/validate", protectedRoute, validadeCoupon);

export default router;
