"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, Check, X, Bell } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface CompanionNotification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function CompanionRequestNotification({ onActionTaken }: { onActionTaken?: () => void }) {
  const { user } = useAuth();
  const [activeNotification, setActiveNotification] = useState<CompanionNotification | null>(null);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        const res = await api.get("/notifications/");
        const companionReq = res.data.find(
          (n: any) => n.type === "COMPANION_REQUEST" && !n.is_read
        );
        if (companionReq) {
          setActiveNotification(companionReq);
        } else {
          setActiveNotification(null);
        }
      } catch (err) {
        // Silently handle if unauthenticated
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleDismiss = async () => {
    if (!activeNotification) return;
    try {
      await api.put(`/notifications/${activeNotification.id}/read`);
      setActiveNotification(null);
    } catch (e) {}
  };

  if (!activeNotification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-white/95 backdrop-blur-md rounded-3xl border border-stone-900/[0.1] shadow-2xl text-stone-900 font-sans"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E] shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Family & Friends Link Request
              </h4>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {activeNotification.message}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                disabled={isResponding}
                onClick={async () => {
                  setIsResponding(true);
                  await handleDismiss();
                  onActionTaken?.();
                  setIsResponding(false);
                }}
                className="px-3.5 py-1.5 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                View & Connect
              </button>

              <button
                type="button"
                disabled={isResponding}
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
