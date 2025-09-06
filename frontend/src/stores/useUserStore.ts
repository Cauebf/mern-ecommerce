import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { AxiosError } from "axios";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

type UserStore = {
  user: User | null;
  loading: boolean;
  checkingAuth: boolean;
  signup: (params: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<string | undefined>;
  login: (email: string, password: string) => Promise<string | undefined>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

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
      return toast.error(err.response?.data?.message || "Something went wrong");
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
      return toast.error(err.response?.data?.message || "Something went wrong");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(
        err.response?.data?.message || "Something went wrong on logout"
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });

    try {
      const response = await axios.get("/auth/profile");

      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },
}));

// TODO: implement axios interceptors for refresh access token
