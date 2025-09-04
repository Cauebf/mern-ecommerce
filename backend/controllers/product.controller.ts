import type { Request, Response } from "express";
import Product from "../models/product.model.js";
import redis from "../lib/redis.js";

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

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    // get featured products from redis and return if found
    const featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts)); // parse() to convert JSON string to javascript object
    }

    // if not in redis, get from database and store in redis
    const featuredProductsDb = await Product.find({ isFeatured: true }).lean(); // lean() to get plain javascript objects instead of mongoose documents (which improves performance)

    if (!featuredProductsDb) {
      return res.status(404).json({ message: "No featured products found" });
    }

    // store in redis for future quick access
    await redis.set(
      "featured_products",
      JSON.stringify(featuredProductsDb), // stringify() to convert javascript object to JSON string
      "EX",
      60 * 60 * 24 // 1 day
    );

    res.json(featuredProductsDb);
  } catch (error) {
    console.error("Error getting featured products:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};
