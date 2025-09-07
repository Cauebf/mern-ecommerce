import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";

type Product = {
  _id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isFeatured?: boolean;
};

type ProductStore = {
  products: Product[];
  loading: boolean;
  setProducts: (products: Product[]) => void;
  createProduct: (productData: Product) => Promise<void>;
  fetchAllProducts: () => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleFeaturedProduct: (productId: string) => Promise<void>;
};

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),

  createProduct: async (productData) => {
    set({ loading: true });

    try {
      const res = await axios.post("/products", productData);
      // this will add the product to the store to update the UI immediately
      set((prevState) => ({
        products: [...prevState.products, res.data.product],
        loading: false,
      }));
      toast.success("Product created successfully");
    } catch (error) {
      set({ loading: false });

      const err = error as AxiosError<{ error?: string }>;
      toast.error(err.response?.data?.error || "Failed to create product");
    }
  },

  fetchAllProducts: async () => {
    set({ loading: true });

    try {
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ loading: false });

      const err = error as AxiosError<{ error?: string }>;
      toast.error(err.response?.data?.error || "Failed to fetch products");
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true });

    try {
      await axios.delete(`/products/${productId}`);
      // this will remove the product from the store to update the UI immediately
      set((prevProducts) => ({
        products: prevProducts.products.filter(
          (product) => product._id !== productId
        ),
        loading: false,
      }));
      toast.success("Product deleted successfully");
    } catch (error) {
      set({ loading: false });

      const err = error as AxiosError<{ error?: string }>;
      toast.error(err.response?.data?.error || "Failed to delete product");
    }
  },

  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });

    try {
      const response = await axios.patch(`/products/${productId}`);
      // this will update the isFeatured prop of the product in the store to update the UI immediately
      set((prevState) => ({
        products: prevState.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: response.data.product.isFeatured }
            : product
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });

      const err = error as AxiosError<{ error?: string }>;
      toast.error(err.response?.data?.error || "Failed to toggle featured");
    }
  },
}));
