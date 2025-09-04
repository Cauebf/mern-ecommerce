import express from "express";
import {
  getAllProducts,
  getFeaturedProducts,
} from "../controllers/product.controller.js";
import { adminRoute, protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectedRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);

export default router;
