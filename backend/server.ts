import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
};

start();
