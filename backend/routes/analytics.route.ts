import express, { type Response } from "express";
import {
  adminRoute,
  protectedRoute,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import {
  getAnalyticsData,
  getDailySalesData,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get(
  "/",
  protectedRoute,
  adminRoute,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const analyticsData = await getAnalyticsData();

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const dailySalesData = await getDailySalesData(startDate, endDate);

      res.status(200).json({ analyticsData, dailySalesData });
    } catch (error) {
      console.error("Error getting analytics data:", error);
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ message });
    }
  }
);

export default router;
