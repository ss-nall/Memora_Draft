"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RefreshCw, AlertCircle, Scan, Zap, CheckCircle2, UserPlus, ArrowRight } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export type ScannerMode = "login" | "capture" | "enroll";

interface BiometricScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: ScannerMode;
  onCaptureComplete?: (file: File) => void;
  onCaptured?: (file: File) => void;
  title?: string;
  subtitle?: string;
}

export function BiometricScannerModal({
  isOpen,
  onClose,
  mode = "login",
  onCaptureComplete,
  onCaptured,
  title,
  subtitle
}: BiometricScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<"positioning" | "capturing" | "matching" | "success" | "failure">("positioning");
  const [errorMessage, setErrorMessage] = useState("");
  const [matchedUserName, setMatchedUserName] = useState("");
  const [showQuickEnroll, setShowQuickEnroll] = useState(false);
  const [enrollName, setEnrollName] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  // Gentle UI audio feedback
  const playTechAudio = useCallback((type: "scan" | "success" | "error") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "scan") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(280, audioCtx.currentTime);
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch {
      // AudioContext unavailable
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsCameraReady(false);
      setErrorMessage("");
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
        setScanStep("positioning");
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser."
          : "Unable to access device camera. Please check your camera settings."
      );
      setScanStep("failure");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setScanStep("positioning");
      setErrorMessage("");
      setShowQuickEnroll(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const captureFrameBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) {
        resolve(null);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95);
    });
  };

  const handleTriggerScan = async () => {
    if (!isCameraReady || isScanning) return;

    setIsScanning(true);
    setScanStep("capturing");
    setErrorMessage("");
    playTechAudio("scan");

    try {
      const blob = await captureFrameBlob();
      if (!blob) throw new Error("Failed to capture image from camera.");
      setCapturedBlob(blob);

      setScanStep("matching");
      const file = new File([blob], `face_scan_${Date.now()}.jpg`, { type: "image/jpeg" });

      if (mode === "capture") {
        // Return captured reference selfie to caller (e.g. for event search)
        playTechAudio("success");
        setScanStep("success");
        setTimeout(() => {
          const cb = onCaptureComplete || onCaptured;
          if (cb) cb(file);
          onClose();
        }, 600);
        return;
      }

      if (mode === "enroll") {
        // Enrolling Face ID for logged in user
        const formData = new FormData();
        formData.append("file", file, file.name);

        const res = await api.post("/auth/register-face", formData);
        playTechAudio("success");
        setScanStep("success");
        setTimeout(() => {
          alert(res.data.message || "Face ID successfully enrolled!");
          onClose();
        }, 800);
        return;
      }

      // Default: Mode === "login"
      const formData = new FormData();
      formData.append("file", file, file.name);

      const res = await api.post("/auth/face-login", formData);
      const { access_token, refresh_token, user } = res.data;

      playTechAudio("success");
      setScanStep("success");
      setMatchedUserName(user.full_name || user.email);

      await login(access_token, refresh_token, user);

      setTimeout(() => {
        onClose();
        router.push("/dashboard");
      }, 900);
    } catch (err: any) {
      playTechAudio("error");
      setScanStep("failure");
      const errorMsg = formatApiError(err, "Face verification failed. Please try again.");
      setErrorMessage(errorMsg);

      if (err.response?.status === 404 && mode === "login") {
        setShowQuickEnroll(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedBlob || !enrollEmail || !enrollName) return;

    setIsScanning(true);
    setErrorMessage("");

    try {
      const file = new File([capturedBlob], `face_enroll_${Date.now()}.jpg`, { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", enrollEmail.trim());
      formData.append("full_name", enrollName.trim());

      const res = await api.post("/auth/face-register", formData);
      const { access_token, refresh_token, user } = res.data;

      playTechAudio("success");
      setScanStep("success");
      setMatchedUserName(user.full_name);

      await login(access_token, refresh_token, user);
      setTimeout(() => {
        onClose();
        router.push("/dashboard");
      }, 900);
    } catch (err: any) {
      playTechAudio("error");
      setScanStep("failure");
      setErrorMessage(formatApiError(err, "Enrollment failed. Please try again."));
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-white border border-stone-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-900 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#C25E2E]">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  {title || (mode === "login" ? "Face ID Sign In" : mode === "capture" ? "Capture Reference Face" : "Enroll Face ID")}
                </h3>
                <span className="text-[11px] text-stone-500 font-mono">
                  {subtitle || "InsightFace 512-D Vector Scan"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Camera Viewport */}
          <div className="p-6 flex flex-col items-center">
            <div className="relative w-full aspect-[4/3] max-h-[320px] bg-stone-950 rounded-2xl overflow-hidden border border-stone-200 shadow-inner flex items-center justify-center">
              {/* Video element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              <canvas ref={canvasRef} className="hidden" />

              {/* Minimal Clean HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5">
                {/* Top Corner Brackets */}
                <div className="flex justify-between w-full">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-white/80 rounded-tl-sm" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-white/80 rounded-tr-sm" />
                </div>

                {/* Central Oval Positioning Guide */}
                <div className="self-center flex items-center justify-center w-40 h-52 relative">
                  <div
                    className={`w-full h-full rounded-full border-2 border-dashed transition-all duration-300 ${
                      scanStep === "success"
                        ? "border-emerald-400 bg-emerald-500/10 scale-105"
                        : scanStep === "failure"
                        ? "border-red-400 bg-red-500/10"
                        : scanStep === "matching" || scanStep === "capturing"
                        ? "border-amber-400 animate-pulse"
                        : "border-white/60"
                    }`}
                  />
                  {/* Subtle scan sweep when capturing */}
                  {(scanStep === "capturing" || scanStep === "matching") && (
                    <motion.div
                      animate={{ y: [-90, 90, -90] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-3/4 h-[2px] bg-amber-400 shadow-[0_0_8px_#f59e0b]"
                    />
                  )}
                </div>

                {/* Bottom Corner Brackets */}
                <div className="flex justify-between w-full">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-white/80 rounded-bl-sm" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-white/80 rounded-br-sm" />
                </div>
              </div>

              {/* Real State Progress Pill */}
              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 text-white">
                <span
                  className={`w-2 h-2 rounded-full ${
                    scanStep === "success"
                      ? "bg-emerald-400"
                      : scanStep === "matching" || scanStep === "capturing"
                      ? "bg-amber-400 animate-pulse"
                      : isCameraReady
                      ? "bg-emerald-400"
                      : "bg-stone-500"
                  }`}
                />
                <span className="text-[10px] font-medium tracking-wide uppercase font-mono">
                  {scanStep === "positioning" && "Align Face In Frame"}
                  {scanStep === "capturing" && "Capturing Frame..."}
                  {scanStep === "matching" && "Matching Face Embedding..."}
                  {scanStep === "success" && "Face Verified"}
                  {scanStep === "failure" && "Position Face Clearly"}
                </span>
              </div>

              {/* Camera Switcher */}
              <button
                type="button"
                onClick={toggleCamera}
                title="Switch Camera"
                className="absolute bottom-3 right-3 p-2 rounded-full bg-stone-900/75 hover:bg-stone-900 text-white border border-white/10 shadow-sm backdrop-blur-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3.5 p-3 w-full rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Confirmation */}
            {scanStep === "success" && (
              <div className="mt-3.5 p-3 w-full rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {matchedUserName ? `Signed in as ${matchedUserName}` : "Face Scan Confirmed"}
                </span>
              </div>
            )}

            {/* 1-Step Quick Enrollment Form */}
            {showQuickEnroll && (
              <form
                onSubmit={handleQuickEnrollSubmit}
                className="mt-4 w-full p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3"
              >
                <div className="flex items-center gap-2 text-stone-900 font-semibold text-xs">
                  <UserPlus className="w-4 h-4 text-[#C25E2E]" />
                  <span>Register This Face & Create Account</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    required
                    className="w-full bg-white border border-stone-300 text-stone-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-stone-300 text-stone-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isScanning}
                  className="w-full py-2 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  {isScanning ? "Enrolling Face..." : "Save Face & Sign In"}
                </button>
              </form>
            )}

            {/* Action Buttons */}
            {!showQuickEnroll && (
              <div className="mt-5 w-full flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!isCameraReady || isScanning}
                  onClick={handleTriggerScan}
                  className="flex-1 py-2.5 px-5 rounded-xl bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScanning ? (
                    <>
                      <Zap className="w-3.5 h-3.5 animate-spin" />
                      <span>{scanStep === "matching" ? "Matching..." : "Capturing..."}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        {mode === "login" ? "Scan Face & Sign In" : mode === "capture" ? "Capture Face Reference" : "Enroll Face ID"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
