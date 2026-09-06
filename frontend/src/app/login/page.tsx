"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import api, { formatApiError } from "@/lib/api";
import { motion } from "framer-motion";
import { Scan, Camera, Sparkles, ShieldCheck, ArrowRight, User } from "lucide-react";
import { BiometricScannerModal } from "@/components/BiometricScannerModal";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
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
      setError(formatApiError(err, "Google Sign-In failed. Please try again."));
    }
  };

  const handleDevLogin = async () => {
    try {
      setError("");
      const response = await api.post("/auth/dev/login", {
        email: "demo@memora.ai",
        full_name: "Demo User"
      });

      const { access_token, refresh_token, user } = response.data;
      await login(access_token, refresh_token, user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(formatApiError(err, "Dev Login failed. Make sure backend is running."));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-6 sm:p-8 border border-stone-900/[0.08] shadow-lg rounded-3xl">
          
          <div className="text-center space-y-2 pb-6">
            <div className="mx-auto w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E] shadow-sm">
              <Scan className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Sign in to Memora</h1>
            <p className="text-stone-500 text-xs leading-relaxed max-w-xs mx-auto">
              Scan your face with your device camera or use your Google account.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Primary Action: Face ID Biometric Camera Sign-In */}
            <button
              onClick={() => setIsFaceModalOpen(true)}
              type="button"
              className="w-full p-4 bg-white hover:bg-stone-50/80 border border-stone-300 hover:border-stone-400 rounded-2xl shadow-sm transition-all text-left flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-[#C25E2E] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    Scan Face to Sign In
                  </div>
                  <div className="text-[11px] text-stone-500">
                    InsightFace 512-D Biometric Match
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#C25E2E] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60">
                Live Scan &rarr;
              </span>
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">Or Continue With</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* Google OAuth Login */}
            <div className="w-full flex justify-center py-1">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google OAuth origin/credentials error. You can use Face ID or Demo Sign-In.");
                }}
                useOneTap={false}
                shape="rectangular"
                theme="outline"
                size="large"
                text="signin_with"
              />
            </div>

            {/* Dev Demo Login Button */}
            <button
              onClick={handleDevLogin}
              type="button"
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200/80 text-stone-700 font-medium rounded-xl border border-stone-200/80 transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-stone-500" />
              Quick Demo / Dev Sign-In
            </button>

            {error && (
              <div className="p-3 w-full rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center leading-relaxed">
                {error}
              </div>
            )}

            <div className="pt-2 text-center text-xs text-stone-500">
              Need to find photos for an event?{" "}
              <Link href="/events" className="text-[#C25E2E] font-medium hover:underline">
                Enter Event Code
              </Link>
            </div>
            
          </div>
        </div>
      </motion.div>

      {/* Biometric Camera Scanner Modal */}
      <BiometricScannerModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        mode="login"
        title="Face ID Sign In"
        subtitle="InsightFace 512-D Vector Scan"
      />
    </div>
  );
}


