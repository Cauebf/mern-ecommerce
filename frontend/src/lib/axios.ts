import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development" // check if we are in development mode or production using vite environment variable
      ? "http://localhost:5000/api"
      : "/api",
  withCredentials: true, // send cookies with requests automatically to backend
});

export default axiosInstance;
