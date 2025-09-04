import type { Request, Response } from "express";
import Product from "../models/product.model.js";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({}); // find all products
    res.status(200).json({ products });
  } catch (error) {
    console.error("Error getting products:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};
