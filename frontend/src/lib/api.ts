import axios from "axios";

// Base URL for our FastAPI backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create Axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach access_token automatically
api.interceptors.request.use((config) => {
  // We'll read from localStorage for now since we are building a quick SPA experience
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
