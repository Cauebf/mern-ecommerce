import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // allows us to access req.body
app.use(cookieParser()); // allows us to access req.cookies

// routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
};

start();
