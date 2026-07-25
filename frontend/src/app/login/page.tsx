"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import api from "@/lib/api";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const { credential } = credentialResponse;
      if (!credential) throw new Error("No credential received from Google");

      const response = await api.post("/auth/google/login", {
        token: credential
      });

      const { access_token, refresh_token, user } = response.data;
      
      login(access_token, refresh_token, user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Google Sign-In failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full bg-[var(--color-surface)] border-[var(--color-surface-border)]">
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-3xl font-bold tracking-tight text-white">Welcome</CardTitle>
            <p className="text-gray-400 text-sm">
              Sign in to Memora to capture and share memories
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            
            <div className="w-full flex justify-center py-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google Login failed");
                }}
                useOneTap
                shape="rectangular"
                theme="filled_black"
                size="large"
                text="signin_with"
              />
            </div>

            {error && (
              <div className="mt-4 p-3 w-full rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
