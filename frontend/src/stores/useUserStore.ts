import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { AxiosError } from "axios";
import type { UserStore } from "../types";

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", {
        name,
        email,
        password,
      });

      set({ user: res.data.user, loading: false });
    } catch (error) {
      set({ loading: false });

      const err = error as AxiosError<{ message?: string }>;
      return toast.error(err.response?.data?.message || "Failed to signup");
    }
  },

  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", {
        email,
        password,
      });

      set({ user: res.data.user, loading: false });
    } catch (error) {
      set({ loading: false });

      const err = error as AxiosError<{ message?: string }>;
      return toast.error(err.response?.data?.message || "Failed to login");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || "Failed to logout");
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });

    try {
      const res = await axios.get("/auth/profile");

      set({ user: res.data, checkingAuth: false });
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },
}));

// TODO: implement axios interceptors for refresh access token
