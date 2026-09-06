"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import storage from "@/lib/storage";

interface User {
  id: string;
  email: string;
  full_name: string;
  profile_picture?: string;
  google_id?: string;
  face_embedding_id?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (access: string, refresh: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
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
    const loadSession = async () => {
      const storedToken = await storage.getItem("access_token");
      const storedUser = await storage.getItem("user");
      
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    loadSession();
  }, []);

  const login = async (access: string, refresh: string, userData: User) => {
    setAccessToken(access);
    setUser(userData);
    await storage.setItem("access_token", access);
    await storage.setItem("refresh_token", refresh);
    await storage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      const refresh = await storage.getItem("refresh_token");
      if (refresh) {
        await api.post("/auth/logout", { refresh_token: refresh });
      }
    } catch (e) {
      console.error("Logout failed on server:", e);
    } finally {
      setAccessToken(null);
      setUser(null);
      await storage.removeItem("access_token");
      await storage.removeItem("refresh_token");
      await storage.removeItem("user");
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
