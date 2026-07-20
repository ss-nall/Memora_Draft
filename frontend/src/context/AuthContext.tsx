"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  full_name: string;
  profile_picture?: string;
  google_id?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (access: string, refresh: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for existing session on app load
    const storedToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (access: string, refresh: string, userData: User) => {
    setAccessToken(access);
    setUser(userData);
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        await api.post("/auth/logout", { refresh_token: refresh });
      }
    } catch (e) {
      console.error("Logout failed on server:", e);
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
