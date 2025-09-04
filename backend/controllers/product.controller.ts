import type { Request, Response } from "express";
import Product from "../models/product.model.js";
import redis from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean(); // lean() to get plain javascript objects instead of mongoose documents (which improves performance)

    // store in redis for future quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts)); // stringify() to convert javascript object to JSON string
  } catch (error) {
    console.error("Error updating featured products cache:", error);
  }
}

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
      JSON.stringify(featuredProductsDb) // stringify() to convert javascript object to JSON string
    );

    res.json(featuredProductsDb);
  } catch (error) {
    console.error("Error getting featured products:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, image, category } = req.body;

    // upload image to cloudinary
    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error("Error creating product:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      const publicId = product.image.split("/").pop()?.split(".")[0]; // this will get the public id from the image url

      // delete image from cloudinary
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("deleted image from cloudinary");
      } catch (error) {
        console.error("Error deleting image from cloudinary:", error);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const getRecommendedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 }, // sample() to get 3 random documents
      },
      {
        // project() to select which fields to return
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error getting recommended products:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  const { category } = req.params;

  try {
    const products = await Product.find({ category }).lean();

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error getting products by category:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};

export const toggleFeaturedProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // toggle isFeatured field
    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save(); // save() to update the document in the database

    // update featured products cache in redis
    await updateFeaturedProductsCache();

    res.status(200).json({ product: updatedProduct });
  } catch (error) {
    console.error("Error toggling featured product:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
};
