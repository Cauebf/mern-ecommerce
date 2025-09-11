import { create } from "zustand";
import { toast } from "react-hot-toast";
import { AxiosError } from "axios";
import axios from "../lib/axios";
import type { CartStore } from "../types";

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,

  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });

      get().calculateTotals(); // calculate subtotal and total to update the UI immediately
    } catch (error) {
      set({ cart: [] });
      const err = error as AxiosError<{ message?: string }>;
      console.error(
        err.response?.data?.message || "Failed to fetch cart items"
      );
    }
  },

  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product._id });
      toast.success("Product added to cart successfully");

      // update the product quantity in the cart to update the UI immediately
      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item._id === product._id
        );
        const newCart = existingItem
          ? // if product already exists in cart, increment quantity
            prevState.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : // if product doesn't exist in cart, add it
            [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });

      get().calculateTotals(); // calculate subtotal and total to update the UI immediately
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete("/cart/", { data: { productId } });

      // remove the product from the cart to update the UI immediately
      set((prevState) => ({
        cart: prevState.cart.filter((item) => item._id !== productId),
      }));
      get().calculateTotals(); // calculate subtotal and total to update the UI immediately
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Failed to remove from cart");
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        get().removeFromCart(productId);
        return;
      }

      await axios.put(`/cart/${productId}`, { quantity });

      // update the quantity of the product in the cart to update the UI immediately
      set((prevState) => ({
        cart: prevState.cart.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        ),
      }));
      get().calculateTotals(); // calculate subtotal and total to update the UI immediately
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Failed to update quantity");
    }
  },

  calculateTotals: () => {
    try {
      // calculate subtotal and total to update the UI immediately
      const { cart, coupon } = get();

      // calculate subtotal by multiplying price and quantity of each item
      const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      let total = subtotal;

      if (coupon) {
        const discount = subtotal * (coupon.discountPercentage / 100);
        total = subtotal - discount;
      }

      set({ subtotal, total });
    } catch (error) {
      console.error("Error calculating totals:", error);
    }
  },
}));
