import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { AxiosError } from "axios";
import type { UserStore } from "../types";

export const useUserStore = create<UserStore>((set, get) => ({
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

  refreshToken: async () => {
    if (get().checkingAuth) return; // Prevent multiple simultaneous refresh attempts

    set({ checkingAuth: true });

    try {
      const res = await axios.post("/auth/refresh-token");

      set({ user: res.data.user, checkingAuth: false });
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// Axios interceptor for token refresh
let refreshPromise: Promise<void> | null = null;

axios.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response; // In this case, we just return the response
  },
  async (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const originalRequest = error.config; // Store the original request

    // Check if the error is due to an expired token (401 status code) and if a refresh is not in progress (avoid infinite loop)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it to complete
        if (refreshPromise) {
          await refreshPromise; // Wait for the refresh to complete
          return axios(originalRequest); // Retry the original request
        }

        // Start a new refresh process
        refreshPromise = useUserStore.getState().refreshToken(); // Call refreshToken from the store
        await refreshPromise;
        refreshPromise = null; // Reset the refresh promise after successful refresh (avoid infinite loop)

        return axios(originalRequest); // Retry the original request
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        useUserStore.getState().logout(); // Call logout from the store to clear user state
        return Promise.reject(refreshError); // Propagate the refresh error to the caller of the original request
      }
    }

    return Promise.reject(error); // Propagate other errors to the caller of the original request
  }
);
