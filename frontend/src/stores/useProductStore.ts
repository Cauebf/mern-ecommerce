import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";

type Product = {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
};

type ProductStore = {
  products: Product[];
  loading: boolean;
  setProducts: (products: Product[]) => void;
  createProduct: (productData: Product) => Promise<void>;
};

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),

  createProduct: async (productData) => {
    set({ loading: true });

    try {
      const res = await axios.post("/products", productData);

      set((prevState) => ({
        products: [...prevState.products, res.data],
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });

      const err = error as AxiosError<{ error?: string }>;
      toast.error(
        err.response?.data?.error || "Something went wrong on logout"
      );
    }
  },
}));
