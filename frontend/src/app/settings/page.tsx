"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Camera, Scan, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BiometricScannerModal } from "@/components/BiometricScannerModal";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 600);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8 text-stone-900">
      
      {/* Top Header */}
      <div className="pb-6 border-b border-stone-200">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          Account & Face ID Settings
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Manage your personal credentials and facial biometric signature for passwordless login and event matching.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Profile Details Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-stone-900/[0.08] shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-stone-900">Profile Information</h2>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100 flex items-center justify-center">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-2xl font-bold text-stone-400">
                    {user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 block">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    defaultValue={user?.full_name}
                    className="w-full bg-white border border-stone-300 text-stone-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 block">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    defaultValue={user?.email}
                    disabled
                    className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-500 cursor-not-allowed text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  onClick={handleSave}
                  isLoading={isSaving}
                  size="sm"
                  className="btn-accent text-xs font-semibold"
                >
                  {saveSuccess ? "Saved Successfully" : "Save Changes"}
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Biometric Face ID Signature Enrollment Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-stone-900/[0.08] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E] shrink-0">
                <Scan className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">
                    Biometric Face ID Signature
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-[#C25E2E] border border-amber-200/60 font-semibold">
                    512-D VECTOR
                  </span>
                </div>
                <p className="text-xs text-stone-600 max-w-lg leading-relaxed">
                  Enroll or update your facial biometric vector using your webcam or phone camera. Enables 1-click passwordless login and automatic photo matching across all events you attend.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#C25E2E] hover:bg-[#A34A20] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <Camera className="w-4 h-4" />
              Scan & Enroll Face ID
            </button>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="glass-card p-6 rounded-3xl border border-stone-900/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-stone-900">Session Management</h4>
            <p className="text-xs text-stone-500">Sign out of your active account on this browser.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

      </div>

      {/* Biometric Face ID Scanner Modal */}
      <BiometricScannerModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        mode="enroll"
        title="Enroll Biometric Face ID"
        subtitle="Memora Neural Link • 512-D Signature"
      />

    </div>
  );
}
