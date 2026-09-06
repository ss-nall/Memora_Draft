"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Camera, Image as ImageIcon, Loader2, Key, ArrowLeft, Play, Clock, Sparkles, 
  Scan, Trash2, Download, Share2, Film, CheckCircle2, AlertCircle, X, ChevronRight, 
  UserCheck, Sliders, Wand2, HeartHandshake, Users, Eye, RefreshCw, Zap, ShieldCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api, { formatApiError } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { MemoryReel } from "@/components/MemoryReel";
import { TemplateEditor, ReelSettings, defaultSettings } from "@/components/TemplateEditor";
import storage from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { BiometricScannerModal } from "@/components/BiometricScannerModal";
import { PhotoEditorModal } from "@/components/PhotoEditorModal";
import { CompanionHubModal } from "@/components/CompanionHubModal";
import { CompanionRequestNotification } from "@/components/CompanionRequestNotification";

interface MatchedPhoto {
  id: string;
  storage_url: string;
  cloudinary_url?: string;
  media_type?: string;
  timestamps?: number[];
  created_at?: string;
  event_id?: string;
  matched_people?: string[];
}

function GuestJoinContent() {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [selfieFiles, setSelfieFiles] = useState<File[]>([]);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState("");
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[] | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [reelSettings, setReelSettings] = useState<ReelSettings>(defaultSettings);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [guestEmbedding, setGuestEmbedding] = useState<number[] | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilingType, setCompilingType] = useState<"AI_REEL" | "VIDEO_MOMENT" | null>(null);
  const [compiledUrl, setCompiledUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PHOTOS" | "VIDEOS">("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<MatchedPhoto | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [newlyAddedCount, setNewlyAddedCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  // New Features: Photo Editor Studio & Family/Friends Group Matching
  const [editingPhoto, setEditingPhoto] = useState<MatchedPhoto | null>(null);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [acceptedCompanions, setAcceptedCompanions] = useState<any[]>([]);
  const [groupMatchMode, setGroupMatchMode] = useState<"SOLO" | "JOINT" | "CIRCLE">("SOLO");
  const [groupPhotos, setGroupPhotos] = useState<MatchedPhoto[] | null>(null);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load code from query parameters or session storage
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code.toUpperCase());
    } else {
      const savedCode = sessionStorage.getItem("memora_last_code");
      if (savedCode) {
        setInviteCode(savedCode);
      }
    }
  }, [searchParams]);

  // Check for existing saved face embedding in session
  useEffect(() => {
    if (!inviteCode) return;
    try {
      const savedEmb = sessionStorage.getItem(`memora_emb_${inviteCode}`);
      if (savedEmb) {
        setGuestEmbedding(JSON.parse(savedEmb));
      }
    } catch {}
  }, [inviteCode]);

  // Fetch accepted companions if eventId is available
  const fetchCompanions = useCallback(async (eventId: string) => {
    if (!user) return;
    try {
      const res = await api.get(`/companions/event/${eventId}/accepted`);
      if (Array.isArray(res.data)) {
        setAcceptedCompanions(res.data);
      }
    } catch (e) {
      // Ignored if unauthenticated
    }
  }, [user]);

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelfieFiles(Array.from(e.target.files));
    }
  };

  // 1-Click Search with Logged-in Account Face ID (No scanning needed)
  const handleSearchWithFaceId = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter the event invite code.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const cleanCode = inviteCode.trim().toUpperCase();
      const response = await api.get(`/guest/my-photos/${cleanCode}`);
      setMatchedPhotos(response.data);
      sessionStorage.setItem("memora_last_code", cleanCode);

      if (response.data && response.data.length > 0) {
        const evId = response.data[0].event_id;
        if (evId) {
          setActiveEventId(evId);
          fetchCompanions(evId);
        }
      }
    } catch (err: any) {
      setError(formatApiError(err, "Could not find event photos with your enrolled Face ID. Please verify your invite code or scan face."));
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Search with Stored Session Face Vector
  const handleSearchWithStoredEmbedding = async () => {
    if (!inviteCode.trim() || !guestEmbedding) return;

    setIsLoading(true);
    setError("");

    try {
      const cleanCode = inviteCode.trim().toUpperCase();
      const response = await api.post(`/guest/match-embedding/${cleanCode}`, {
        embedding: guestEmbedding
      });
      setMatchedPhotos(response.data);
      sessionStorage.setItem("memora_last_code", cleanCode);

      if (response.data && response.data.length > 0) {
        const evId = response.data[0].event_id;
        if (evId) {
          setActiveEventId(evId);
          fetchCompanions(evId);
        }
      }
    } catch (err: any) {
      setError(formatApiError(err, "Could not match photos using stored face vector. Please scan again."));
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Initial Search with Face / Selfie
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("Please enter a valid event invite code.");
      return;
    }
    if (selfieFiles.length === 0) {
      setError("Please scan your face or select at least one selfie so we can search the gallery!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const cleanCode = inviteCode.trim().toUpperCase();
      const formData = new FormData();
      selfieFiles.forEach((file) => {
        formData.append("files", file);
      });
      if (email.trim()) {
        formData.append("email", email.trim());
      }

      const response = await api.post(`/guest/match/${cleanCode}`, formData);

      const embeddingHeader = response.headers["x-guest-embedding"] || response.headers["X-Guest-Embedding"];
      if (embeddingHeader) {
        try {
          const parsedEmb = typeof embeddingHeader === "string" ? JSON.parse(embeddingHeader) : embeddingHeader;
          if (Array.isArray(parsedEmb) && parsedEmb.length === 512) {
            setGuestEmbedding(parsedEmb);
            sessionStorage.setItem(`memora_emb_${cleanCode}`, JSON.stringify(parsedEmb));
          }
        } catch (e) {
          console.error("Could not parse guest embedding header", e);
        }
      }
      sessionStorage.setItem("memora_last_code", cleanCode);

      if (response.data && Array.isArray(response.data)) {
        setMatchedPhotos(response.data);

        if (response.data.length > 0) {
          const evId = response.data[0].event_id;
          if (evId) {
            setActiveEventId(evId);
            fetchCompanions(evId);
          }
        }
      }
    } catch (err: any) {
      setError(formatApiError(err, "Could not find event or process reference face. Please check your invite code."));
    } finally {
      setIsLoading(false);
    }
  };

  // Live Auto-Sync / Manual Refresh: Updates gallery when new photos are uploaded in background
  const handleSyncPhotos = useCallback(async (silent = false) => {
    if (!inviteCode) return;
    const cleanCode = inviteCode.trim().toUpperCase();

    // Do NOT sync if we don't have a reference embedding or logged in user
    if (!guestEmbedding && !user) {
      return;
    }

    if (!silent) setIsSyncing(true);

    try {
      let resData: MatchedPhoto[] | null = null;

      if (guestEmbedding) {
        const res = await api.post(`/guest/match-embedding/${cleanCode}`, {
          embedding: guestEmbedding
        });
        resData = res.data;
      } else if (user) {
        try {
          const res = await api.get(`/guest/my-photos/${cleanCode}`);
          resData = res.data;
        } catch (e) {
          // Ignore if user does not have enrolled face ID
        }
      }

      if (resData && Array.isArray(resData)) {
        setMatchedPhotos((prev) => {
          if (!prev) return resData;
          
          // Never clear existing photos if sync returns empty due to transient error
          if (resData.length === 0 && prev.length > 0) {
            return prev;
          }

          const prevIds = new Set(prev.map((p) => p.id));
          const newItems = resData.filter((p) => !prevIds.has(p.id));
          
          if (newItems.length > 0) {
            setNewlyAddedCount((c) => c + newItems.length);
            setTimeout(() => setNewlyAddedCount(0), 8000);
          }
          return resData;
        });

        if (resData.length > 0 && !activeEventId && resData[0].event_id) {
          setActiveEventId(resData[0].event_id);
          fetchCompanions(resData[0].event_id);
        }

        setLastSyncedAt(new Date());
      }
    } catch (err) {
      if (!silent) console.error("Gallery sync failed:", err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [inviteCode, guestEmbedding, user, activeEventId, fetchCompanions]);

  const syncRef = useRef(handleSyncPhotos);
  useEffect(() => {
    syncRef.current = handleSyncPhotos;
  }, [handleSyncPhotos]);

  // Background Auto-Sync Interval: Checks for newly uploaded photos every 12 seconds
  useEffect(() => {
    if (!matchedPhotos || !inviteCode) return;

    const interval = setInterval(() => {
      syncRef.current?.(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [matchedPhotos, inviteCode]);

  const handleGroupModeChange = async (mode: "SOLO" | "JOINT" | "CIRCLE") => {
    setGroupMatchMode(mode);
    if (mode === "SOLO") {
      setGroupPhotos(null);
      return;
    }

    if (!activeEventId || acceptedCompanions.length === 0) {
      return;
    }

    setIsGroupLoading(true);
    try {
      const companionIds = acceptedCompanions.map((c) => c.id);
      const res = await api.post(`/companions/event/${activeEventId}/group-photos`, {
        companion_user_ids: companionIds,
        match_mode: mode === "JOINT" ? "INTERSECTION" : "UNION",
      });
      setGroupPhotos(res.data);
    } catch (err) {
      console.error("Failed to fetch group photos", err);
    } finally {
      setIsGroupLoading(false);
    }
  };

  const getImageUrl = (photo: MatchedPhoto) => {
    if (photo.cloudinary_url) return photo.cloudinary_url;
    const normalizedPath = photo.storage_url.replace(/\\/g, "/");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/${normalizedPath}`;
  };

  const handleCompileMemory = async (type: "AI_REEL" | "VIDEO_MOMENT") => {
    if (!inviteCode) return;
    setIsCompiling(true);
    setCompilingType(type);
    setCompiledUrl(null);
    try {
      const payload: any = {
        event_code: inviteCode.trim().toUpperCase(),
        memory_type: type,
        face_embedding: guestEmbedding || []
      };

      const res = await api.post("/reels/compile", payload);
      setCompiledUrl(res.data.video_url);
    } catch (err) {
      console.error("Reel generation failed", err);
      alert("Failed to compile video highlight reel.");
    } finally {
      setIsCompiling(false);
      setCompilingType(null);
    }
  };

  const handleDownloadAll = async () => {
    const mediaPool = groupPhotos || matchedPhotos;
    if (!mediaPool || mediaPool.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`Memora_${inviteCode}`) || zip;

      const promises = mediaPool.map(async (photo, index) => {
        try {
          const url = getImageUrl(photo);
          const response = await fetch(url);
          const blob = await response.blob();
          const ext = photo.media_type === "VIDEO" ? "mp4" : "jpg";
          folder.file(`memory_${index + 1}.${ext}`, blob);
        } catch (e) {
          console.error("Failed to download image for zip", e);
        }
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Memora_${inviteCode}_Matched.zip`);
    } catch (e) {
      console.error("Zip failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Event Photos",
          text: `Check out my matched photos from event ${inviteCode}!`,
          url: url,
        });
      } catch (e) {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleRequestContributor = async () => {
    try {
      if (!user) {
        alert("Please sign in or create an account to contribute photos.");
        router.push("/login");
        return;
      }

      const joinRes = await api.post(`/events/${inviteCode}/join`);
      const eventId = joinRes.data.event_id;

      await api.post(`/events/${eventId}/request-contributor`);
      setRequestStatus("Contributor request submitted! The event organizer has been notified.");
    } catch (e: any) {
      setRequestStatus(formatApiError(e, "Failed to submit contributor request."));
    }
  };

  const currentMediaPool = groupPhotos || matchedPhotos || [];
  const filteredPhotos = currentMediaPool.filter((p) => {
    if (activeFilter === "PHOTOS") return p.media_type !== "VIDEO";
    if (activeFilter === "VIDEOS") return p.media_type === "VIDEO";
    return true;
  });

  const photoCount = currentMediaPool.filter((p) => p.media_type !== "VIDEO").length;
  const videoCount = currentMediaPool.filter((p) => p.media_type === "VIDEO").length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
      
      {/* Real-time incoming companion notification banner */}
      <CompanionRequestNotification
        onActionTaken={() => {
          if (activeEventId) fetchCompanions(activeEventId);
        }}
      />

      {/* Join & Face Search View */}
      {!matchedPhotos ? (
        <div className="w-full max-w-lg my-auto py-8">
          <div className="glass-card p-6 sm:p-8 border border-stone-900/[0.08] shadow-lg rounded-3xl">
            
            <div className="text-center space-y-2 pb-6">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E] shadow-sm">
                <Scan className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                Find Your Photos
              </h1>
              <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                Enter your event code. Our AI instantly matches your face across all event photos & video clips.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              
              {/* Event Invite Code */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 block">
                  Event Invite Code
                </label>
                <Input
                  type="text"
                  placeholder="e.g. WED-9421"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  icon={<Key className="h-4 w-4" />}
                  required
                  className="font-mono uppercase tracking-wider"
                />
              </div>

              {/* 1-Click Instant Search for Logged-In Users with Enrolled Face ID */}
              {user && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#C25E2E]" />
                      <span className="text-xs font-semibold text-stone-900">
                        Signed In as {user.full_name || user.email}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      NO SCAN NEEDED
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Use your saved biometric Face ID to instantly search the event without scanning your face again.
                  </p>
                  <Button
                    type="button"
                    onClick={handleSearchWithFaceId}
                    disabled={isLoading || !inviteCode.trim()}
                    className="w-full h-10 text-xs font-semibold btn-accent shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Search Gallery with Saved Face ID</span>
                  </Button>
                </div>
              )}

              {/* 1-Click Search with Stored Session Embedding */}
              {!user && guestEmbedding && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                    <span className="flex items-center gap-1.5">
                      <Scan className="w-3.5 h-3.5 text-[#C25E2E]" /> Reference Face Ready
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      SAVED IN SESSION
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSearchWithStoredEmbedding}
                    disabled={isLoading || !inviteCode.trim()}
                    className="w-full h-9 text-xs font-semibold btn-accent shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Search with Stored Reference Face</span>
                  </Button>
                </div>
              )}

              {/* Reference Face Capture (Camera Scan or Upload) */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 block">
                  {user || guestEmbedding ? "Or Scan / Upload A New Face" : "Reference Face (Live Camera or Selfie)"}
                </label>
                
                <div className="space-y-3">
                  {/* Live Camera Button */}
                  <button
                    type="button"
                    onClick={() => setIsLiveCameraOpen(true)}
                    className="w-full p-3.5 bg-white hover:bg-stone-50 border border-stone-300 hover:border-stone-400 rounded-2xl shadow-sm text-left flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-[#C25E2E] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-900">
                          Scan Face with Device Camera
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Instant live camera positioning & capture
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#C25E2E] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      LIVE
                    </span>
                  </button>

                  {/* Upload Selfie File Alternative */}
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs font-medium border-stone-300 text-stone-700 hover:bg-stone-50 h-10 cursor-pointer" 
                      type="button"
                    >
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                        multiple
                        onChange={handleSelfieSelect}
                      />
                      <ImageIcon className="w-3.5 h-3.5 mr-2 text-stone-500" />
                      Or Select Selfie Image(s)
                    </Button>
                  </div>

                  {/* Active Reference File Chips */}
                  {selfieFiles.length > 0 && (
                    <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-stone-600 font-medium">
                        <span>Face Reference Ready:</span>
                        <span className="text-[#C25E2E] font-semibold">{selfieFiles.length} File(s)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selfieFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-[11px] text-stone-800 shadow-xs"
                          >
                            <Scan className="w-3 h-3 text-[#C25E2E]" />
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelfieFiles(selfieFiles.filter((_, i) => i !== idx))}
                              className="text-stone-400 hover:text-red-500 ml-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Email */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Email Address <span className="text-stone-400 font-normal lowercase">(optional notification)</span></span>
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <Button 
                type="submit" 
                className="w-full h-12 text-sm font-semibold btn-accent shadow-sm" 
                isLoading={isLoading}
              >
                {isLoading ? "Searching Event Media with AI..." : "Search Event Media"}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        /* Results View: Personalized Gallery, Video Moments & Live Sync */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full space-y-6"
        >
          {/* Top Bar: Back & Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMatchedPhotos(null);
                    setGroupPhotos(null);
                    setGroupMatchMode("SOLO");
                  }}
                  className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change Search / Re-scan Face
                </button>

                {/* Live Auto-Sync Status Pill */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Sync Active</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Your Personalized Gallery
              </h1>
              <p className="text-xs sm:text-sm text-stone-600">
                InsightFace matched you in <span className="font-semibold text-stone-900">{photoCount} photos</span> and <span className="font-semibold text-stone-900">{videoCount} video clips</span>.
              </p>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Manual Refresh / Sync Button */}
              <button
                type="button"
                onClick={() => handleSyncPhotos(false)}
                disabled={isSyncing}
                className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Check for newly uploaded event photos"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#C25E2E] ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync Photos"}</span>
              </button>

              {/* Family & Friends Hub Button */}
              {activeEventId && (
                <button
                  type="button"
                  onClick={() => setIsCompanionModalOpen(true)}
                  className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 text-[#C25E2E]" />
                  <span>Family & Friends</span>
                  {acceptedCompanions.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#C25E2E] text-white text-[10px] flex items-center justify-center font-bold">
                      {acceptedCompanions.length}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shareSuccess ? "Link Copied!" : "Share Link"}
              </button>

              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="px-4 py-2 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Zipping All...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Download All (ZIP)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Newly Added Photos Toast Notification */}
          <AnimatePresence>
            {newlyAddedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                  <span>✨ {newlyAddedCount} new photo(s) were just uploaded to the event and automatically added to your gallery!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewlyAddedCount(0)}
                  className="p-1 hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Group Companion View Tabs (if accepted companions exist) */}
          {acceptedCompanions.length > 0 && (
            <div className="glass-card p-3 rounded-2xl border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                <Users className="w-4 h-4 text-[#C25E2E]" />
                <span>Group Matching Mode:</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleGroupModeChange("SOLO")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    groupMatchMode === "SOLO"
                      ? "bg-[#C25E2E] text-white shadow-xs"
                      : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  My Solo Photos
                </button>
                <button
                  type="button"
                  onClick={() => handleGroupModeChange("JOINT")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    groupMatchMode === "JOINT"
                      ? "bg-[#C25E2E] text-white shadow-xs"
                      : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  Joint Photos (Me + Companions)
                </button>
                <button
                  type="button"
                  onClick={() => handleGroupModeChange("CIRCLE")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    groupMatchMode === "CIRCLE"
                      ? "bg-[#C25E2E] text-white shadow-xs"
                      : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  Full Circle Memories
                </button>
              </div>
            </div>
          )}

          {/* AI Memories & Highlights Strip */}
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-stone-900/[0.08] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C25E2E]" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    AI Memory Reel & Video Highlights
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Generate dynamic animated slideshows and stitched MP4 video highlights from your matched moments.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStudioOpen(true)}
                  className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#C25E2E]" />
                  Play Memory Reel
                </button>

                <button
                  type="button"
                  disabled={isCompiling}
                  onClick={() => handleCompileMemory("AI_REEL")}
                  className="px-3.5 py-1.5 bg-[#C25E2E] hover:bg-[#A34A20] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isCompiling && compilingType === "AI_REEL" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Rendering MP4...
                    </>
                  ) : (
                    <>
                      <Film className="w-3.5 h-3.5" />
                      Compile MP4 Highlight
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Rendered MP4 Ready Alert */}
            {compiledUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 text-emerald-900 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Your AI Video Highlight is ready!</span>
                    <span className="text-[11px] text-emerald-700">FFmpeg stitched your matched photos into an HD MP4.</span>
                  </div>
                </div>
                <a
                  href={compiledUrl}
                  download="Memora_Highlight_Reel.mp4"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download MP4
                </a>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              {(["ALL", "PHOTOS", "VIDEOS"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeFilter === filter
                      ? "bg-[#C25E2E] text-white shadow-xs"
                      : "bg-white hover:bg-stone-100 text-stone-600 border border-stone-200"
                  }`}
                >
                  {filter === "ALL" && `All Media (${currentMediaPool.length})`}
                  {filter === "PHOTOS" && `Photos Only (${photoCount})`}
                  {filter === "VIDEOS" && `Video Moments (${videoCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Media Grid */}
          {isGroupLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-stone-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C25E2E]" />
              <span className="text-xs">Finding joint companion memories...</span>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="glass-card text-center py-16 px-4 rounded-3xl border border-stone-200 text-stone-500 text-xs">
              No media matches found for the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredPhotos.map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs flex flex-col justify-end"
                >
                  {item.media_type === "VIDEO" ? (
                    <div 
                      className="w-full h-full cursor-pointer relative"
                      onClick={() => setSelectedPhoto(item)}
                    >
                      <video
                        id={`video-${item.id}`}
                        src={getImageUrl(item)}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/70 text-white rounded-md text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-xs">
                        <Film className="w-3 h-3 text-purple-400" />
                        VIDEO
                      </div>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getImageUrl(item)}
                      alt="Matched Memory"
                      onClick={() => setSelectedPhoto(item)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                      loading="lazy"
                    />
                  )}

                  {/* Companion tags on card if joint match */}
                  {item.matched_people && item.matched_people.length > 1 && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-amber-500/90 text-white rounded-md text-[9px] font-semibold flex items-center gap-1 backdrop-blur-xs shadow-xs">
                      <Users className="w-2.5 h-2.5" />
                      {item.matched_people.join(" + ")}
                    </div>
                  )}

                  {/* Hover Actions Toolbar */}
                  <div className="absolute inset-0 bg-stone-950/45 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-between p-2.5 text-white pointer-events-none">
                    <div className="flex items-center gap-1 pointer-events-auto">
                      {/* Full Photo Editor Studio Button */}
                      {item.media_type !== "VIDEO" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPhoto(item);
                          }}
                          className="p-1.5 bg-white/90 hover:bg-white text-stone-900 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                          title="Open Photo Studio Editor"
                        >
                          <Sliders className="w-3 h-3 text-[#C25E2E]" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 pointer-events-auto">
                      <a
                        href={getImageUrl(item)}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-white/90 hover:bg-white text-stone-900 rounded-lg shadow-xs transition-colors"
                        title="Download photo"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Become a Contributor Banner */}
          <div className="glass-card p-6 rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-stone-900">Taken photos at this event?</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Request contributor access to upload your own camera captures into the event pool.
              </p>
            </div>

            {requestStatus ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                {requestStatus}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestContributor}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Request Contributor Upload Access
              </button>
            )}
          </div>

        </motion.div>
      )}

      {/* Biometric Live Camera Modal */}
      <BiometricScannerModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        mode="capture"
        title="Live Face Alignment Scanner"
        subtitle="Align face within frame for event media matching"
        onCaptured={(file) => {
          setSelfieFiles([file]);
          setIsLiveCameraOpen(false);
        }}
      />

      {/* Memory Reel Slideshow Modal */}
      {matchedPhotos && (
        <MemoryReel
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          memories={groupPhotos || matchedPhotos}
          baseUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
          settings={reelSettings}
        />
      )}

      {/* Lightbox Inspector Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white"
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-stone-800 bg-stone-950/60">
              <span className="text-xs font-mono text-stone-400">ID: {selectedPhoto.id}</span>
              <div className="flex items-center gap-2">
                {selectedPhoto.media_type !== "VIDEO" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhoto(selectedPhoto);
                      setSelectedPhoto(null);
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Open in Studio Editor
                  </button>
                )}
                <a
                  href={getImageUrl(selectedPhoto)}
                  download
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex items-center justify-center p-2 bg-stone-950">
              {selectedPhoto.media_type === "VIDEO" ? (
                <video
                  src={getImageUrl(selectedPhoto)}
                  controls
                  autoPlay
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImageUrl(selectedPhoto)}
                  alt="High-Res Memory"
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Photo Editor Studio Modal */}
      {editingPhoto && (
        <PhotoEditorModal
          isOpen={true}
          onClose={() => setEditingPhoto(null)}
          imageUrl={getImageUrl(editingPhoto)}
          imageTitle={`Memory_${editingPhoto.id.split("-")[0]}`}
        />
      )}

      {/* Family & Friends Group Hub Modal */}
      {activeEventId && (
        <CompanionHubModal
          isOpen={isCompanionModalOpen}
          onClose={() => setIsCompanionModalOpen(false)}
          eventId={activeEventId}
          eventName={inviteCode}
          onCompanionUpdated={() => {
            fetchCompanions(activeEventId);
          }}
        />
      )}

    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Loading Memora...</div>}>
      <GuestJoinContent />
    </Suspense>
  );
}
