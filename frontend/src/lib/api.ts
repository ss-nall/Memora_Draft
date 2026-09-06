import axios from "axios";

// Base URL for our FastAPI backend
let API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  if (hostname === "10.0.2.2") {
    API_URL = "http://10.0.2.2:8000";
  } else if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "") {
    API_URL = `http://${hostname}:8000`;
  }
}

// Create Axios instance
export const api = axios.create({
  baseURL: API_URL,
});

import storage from "./storage";

// Request interceptor to attach access_token automatically
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized, try refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItem("refresh_token");
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          if (res.status === 200) {
            const newAccessToken = res.data.access_token;
            await storage.setItem("access_token", newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // If refresh fails, log out completely
        await storage.removeItem("access_token");
        await storage.removeItem("refresh_token");
        await storage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiError(err: any, fallback = "An unexpected error occurred"): string {
  if (!err) return fallback;
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        if (typeof d === "string") return d;
        if (d && typeof d === "object") return d.msg || JSON.stringify(d);
        return String(d);
      })
      .join(", ");
  }
  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  if (err.message && typeof err.message === "string") return err.message;
  return fallback;
}

export default api;
