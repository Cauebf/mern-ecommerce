import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins, // allow requests from these origins
    credentials: true, // allow sending cookies with requests
  })
);
app.use(express.json({ limit: "10mb" })); // allows us to access req.body
app.use(cookieParser()); // allows us to access req.cookies

// routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
};

start();
