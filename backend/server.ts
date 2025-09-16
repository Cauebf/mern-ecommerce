import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimiter from "express-rate-limit";

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

const __dirname = path.resolve(); // get the current directory path
const allowedOrigins = ["http://localhost:5173", `${process.env.CLIENT_URL}`];

app.use(
  cors({
    origin: allowedOrigins, // allow requests from these origins
    credentials: true, // allow sending cookies with requests
  })
);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(
  helmet({
    // secure HTTP headers to protect against common vulnerabilities
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", // allow scripts from the same origin
          "https://js.stripe.com", // allow scripts from Stripe
        ],
        connectSrc: ["'self'", "https://api.stripe.com"], // allow connections to Stripe
        frameSrc: ["'self'", "https://js.stripe.com"], // allow frames from Stripe
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // allow images from Cloudinary
      },
    },
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

if (process.env.NODE_ENV !== "development") {
  // Serve static files (HTML, CSS, JS, images, etc.) from the "frontend/dist" directory (the production build of the frontend app)
  app.use(express.static(path.join(__dirname, "frontend/dist")));

  // For any route not handled by the backend (e.g., /cart, /profile, /product/123), always return the "index.html" file.
  // This allows frontend routing (React Router) to work properly when users refresh the page or access a deep link directly.
  app.get("/{*any}", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
};

start();
