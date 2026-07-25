"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Image as ImageIcon, Loader2, Key, ArrowLeft, Play, Clock, Sparkles, Download, UserPlus, Check, Sliders, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { MemoryReel } from "@/components/MemoryReel";
import { TemplateEditor, ReelSettings, defaultSettings } from "@/components/TemplateEditor";

interface MatchedPhoto {
  id: string;
  storage_url: string;
  cloudinary_url?: string;
  media_type?: string;
  timestamps?: number[];
}

function GuestJoinContent() {
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [selfieFiles, setSelfieFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState("");
  const [error, setError] = useState("");
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[] | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [reelSettings, setReelSettings] = useState<ReelSettings>(defaultSettings);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);

  // Selfie selecting handler
  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelfieFiles(Array.from(e.target.files));
      setError("");
    }
  };

  // Run the biometric scan animation, then hit the API
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selfieFiles.length === 0) {
      setError("Please select at least one selfie so we can find your photos!");
      return;
    }

    setError("");
    setIsScanning(true);
    setScanProgress(0);
    setScanStatusText("Scanning biometric landmarks...");

    // Start simulation progress bar
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2.5;
      if (progress >= 50 && progress < 55) {
        setScanStatusText("Mapping 512-dimensional facial vector...");
      }
      if (progress >= 80 && progress < 85) {
        setScanStatusText("Syncing with memory database...");
      }

      if (progress >= 100) {
        setScanProgress(100);
        clearInterval(interval);
        // Execute matched request
        executeMatchRequest();
      } else {
        setScanProgress(progress);
      }
    }, 100);
  };

  // Call matching API
  const executeMatchRequest = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      selfieFiles.forEach((file) => {
        formData.append("files", file);
      });
      if (email) {
        formData.append("email", email);
      }

      const response = await api.post(`/guest/match/${inviteCode}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMatchedPhotos(response.data);
      setIsScanning(false);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : "Could not find event or process selfie. Check your code.");
      setIsScanning(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Neural particle canvas animation in scanner view
  useEffect(() => {
    if (isScanning && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
      }> = [];

      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
        });
      }

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            p.x = Math.random() * canvas.width;
            p.y = Math.random() * canvas.height;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(188, 1, 0, 0.25)";
          ctx.fill();
        });
        animationFrameId.current = requestAnimationFrame(draw);
      };

      draw();
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isScanning]);

  const getImageUrl = (photo: MatchedPhoto) => {
    if (photo.cloudinary_url) return photo.cloudinary_url;
    const normalizedPath = photo.storage_url.replace(/\\/g, '/');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/${normalizedPath}`;
  };

  const handleDownloadAll = async () => {
    if (!matchedPhotos || matchedPhotos.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const imagePromises = matchedPhotos.map(async (photo, index) => {
        const response = await fetch(getImageUrl(photo));
        const blob = await response.blob();
        const extMatch = photo.storage_url.match(/\.([^.]+)$/);
        const ext = extMatch ? extMatch[1] : "jpg";
        zip.file(`memory_${index + 1}.${ext}`, blob);
      });

      await Promise.all(imagePromises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `memora_event_${inviteCode}.zip`);
    } catch (err) {
      console.error("Failed to zip and download images", err);
      alert("Failed to download all memories. Please try downloading individually.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const seekVideo = (id: string, time: number) => {
    const videoElement = document.getElementById(`video-${id}`) as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = time;
      videoElement.play().catch(console.error);
    }
  };

  return (
    <div className="min-h-screen pt-[120px] pb-24 bg-surface text-on-surface font-body-md">
      
      {/* Outer Shell Wrapper */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col items-center">
        
        {/* BACK button */}
        <div className="w-full max-w-4xl self-start mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-secondary hover:text-on-surface p-0 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-primary" /> Back to Home
            </Button>
          </Link>
        </div>

        {/* SCANNER VIEW (If not joined/matched yet) */}
        {!matchedPhotos ? (
          <div className="w-full max-w-4xl flex flex-col items-center text-center">
            
            {/* Header */}
            <div className="mb-12 space-y-2">
              <h1 className="font-display-lg text-4xl sm:text-5xl text-on-surface tracking-tighter font-semibold">
                Create My Memory Profile
              </h1>
              <p className="font-body-lg text-lg text-secondary">
                We'll now search the event database to find you in every snapshot.
              </p>
            </div>

            {/* Main Biometric Scanner Circle */}
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center mb-8 reveal active">
              
              {/* Spinning borders */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-[-15px] rounded-full border border-outline-variant/10 animate-[spin_15s_linear_infinite_reverse]"></div>

              {/* Central feed frame */}
              <div className="absolute inset-[8px] rounded-full border-[10px] border-surface-container-high overflow-hidden camera-container shadow-2xl relative">
                
                {/* Simulated photo feed / chosen selfie preview */}
                {selfieFiles.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    id="live-feed"
                    src={URL.createObjectURL(selfieFiles[0])}
                    className="w-full h-full object-cover"
                    alt="Selfie preview"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    id="live-feed"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOYoeh1QN8LAJ0ItCf5O2A0ltAw9zqiAGDbL1MKidrH774lYNIb75a3p3ziVM5VtCP39-xox5bC8JfiWdeSboleGHj2IliTlcktREyGYFQWNfBOiJO3uX00-F5t2s-fdfzUKnXHKwNFpyfouPWMiXVFnY07b_TRdtefBUIuX_BxiTdJuDO_7H7GjE2WW_TEXlxqQMy7cL0yBsSLy3c-dDR64ZCLZEcE8PzpHClMG0znwkjmOSAhtvnpVzryHXu8udPpR-FH0fuApQr"
                    className="w-full h-full object-cover opacity-75"
                    alt="Biometric face demo"
                  />
                )}

                {/* Animated Scanner Overlays */}
                {isScanning && (
                  <>
                    <div className="absolute inset-0 scan-line z-10 pointer-events-none"></div>
                    <canvas ref={canvasRef} className="absolute inset-0 z-20 w-full h-full pointer-events-none" id="neural-overlay"></canvas>
                  </>
                )}

                {/* Sensor Badges */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 w-max">
                  <div className="flex items-center gap-1 bg-glass-fill px-3 py-1 rounded-full backdrop-blur-md text-[10px] font-label-caps uppercase text-on-surface shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Lighting: Perfect
                  </div>
                  <div className="flex items-center gap-1 bg-glass-fill px-3 py-1 rounded-full backdrop-blur-md text-[10px] font-label-caps uppercase text-on-surface shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Face Found
                  </div>
                </div>

              </div>
            </div>

            {/* Inputs & Submission */}
            <form onSubmit={handleJoinSubmit} className="w-full max-w-sm flex flex-col gap-6">
              <div className="space-y-3 text-left">
                <label className="text-xs font-semibold text-secondary uppercase font-label-caps tracking-wider block">Invite Code</label>
                <Input
                  type="text"
                  placeholder="e.g. EVENT-12345"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  icon={<Key className="h-5 w-5 text-secondary" />}
                  required
                  className="font-mono uppercase tracking-wider h-12"
                />
              </div>

              <div className="space-y-3 text-left">
                <label className="text-xs font-semibold text-secondary uppercase font-label-caps tracking-wider block">Email Address (Optional)</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Upload Selfie Dropzone */}
              <div className="text-left space-y-3">
                <label className="text-xs font-semibold text-secondary uppercase font-label-caps tracking-wider block">Upload Profile Photo</label>
                <div className="border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-pure hover:bg-surface-container-low transition-colors p-6 flex flex-col items-center justify-center relative cursor-pointer group">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleSelfieSelect}
                  />
                  <Camera className="w-8 h-8 text-primary mb-2 group-hover:scale-105 duration-300" />
                  <p className="text-sm font-semibold text-on-surface">Select 1-3 Selfies</p>
                  <p className="text-xs text-secondary mt-1">Upload clear front profile files</p>
                </div>
                {selfieFiles.length > 0 && (
                  <p className="text-xs text-primary font-semibold mt-1">
                    ✓ {selfieFiles.length} photo(s) selected
                  </p>
                )}
              </div>

              {/* Scan progress loader */}
              {isScanning && (
                <div className="w-full space-y-2">
                  <div className="relative h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary transition-all duration-100 ease-linear" 
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-xs font-label-caps uppercase text-secondary tracking-widest animate-pulse">
                    {scanStatusText}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isScanning || isSelfieFilesEmpty()}
                className="w-full h-14 bg-primary hover:bg-primary-container text-white rounded-full font-bold text-lg shadow-lg hover:shadow-primary/10 tracking-wide transition-all active:scale-[0.98]"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
                    Biometrics Scanning...
                  </>
                ) : (
                  "Find My Memories"
                )}
              </Button>
            </form>
          </div>
        ) : (
          
          /* MEMORY HUB VIEW (If matchedPhotos is set) */
          <div className="w-full">
            
            {/* Header Banner */}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/20 pb-8">
              <div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-label-caps uppercase font-bold inline-block mb-3">
                  AI match engine online
                </span>
                <h1 className="font-display-lg text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-2">
                  Julian, we found your memories.
                </h1>
                <p className="font-body-lg text-secondary">
                  InsightFace AI matched you in <strong className="text-on-surface">{matchedPhotos.length}</strong> photo(s) and clips.
                </p>
              </div>

              {/* Action bar triggers */}
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("access_token");
                      if (!token) {
                        alert("You must be logged in as a registered user to request becoming a contributor.");
                        router.push("/login");
                        return;
                      }
                      
                      const joinRes = await api.post(`/events/${inviteCode}/join`);
                      const eventId = joinRes.data.event_id;
                      
                      await api.post(`/events/${eventId}/request-contributor`);
                      setRequestStatus("Request Sent! Awaiting photographer approval.");
                    } catch (e: any) {
                      if (e.response?.data?.detail) {
                        setRequestStatus(e.response.data.detail);
                      } else {
                        setRequestStatus("Failed to submit request.");
                      }
                    }
                  }} 
                  variant="outline"
                  className="rounded-full h-11 border-outline-variant hover:bg-surface-container text-secondary hover:text-on-surface"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Become Contributor
                </Button>

                <Button 
                  onClick={() => setIsStudioOpen(true)} 
                  variant="secondary"
                  className="rounded-full h-11 border border-outline-variant/30 hover:bg-surface-container"
                >
                  <Sliders className="w-4 h-4 mr-2 text-primary" />
                  AI Reel Studio
                </Button>

                <Button 
                  onClick={handleDownloadAll} 
                  isLoading={isDownloading}
                  className="rounded-full h-11 bg-on-surface text-surface-pure hover:opacity-90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download ZIP
                </Button>
              </div>
            </header>

            {requestStatus && (
              <div className="w-full text-center p-3.5 mb-8 bg-primary-fixed/20 text-on-primary-fixed-variant rounded-xl border border-outline-variant/30 text-sm font-semibold">
                {requestStatus}
              </div>
            )}

            {matchedPhotos.length === 0 ? (
              
              /* No Photos Found UI */
              <Card className="text-center py-24 border-dashed border-outline-variant/20 rounded-3xl bg-surface-pure">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">No Matches Found</h3>
                  <p className="text-secondary max-w-sm mx-auto text-sm leading-relaxed">
                    We couldn't find you in this event's current catalog yet. The host might still be processing uploads!
                  </p>
                  <div className="pt-2">
                    <Button onClick={() => setMatchedPhotos(null)} variant="outline" className="rounded-full">
                      Try Another Profile Selfie
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              
              /* bento Grid of Matched Photos */
              <div className="space-y-12">
                
                {/* Horizontal Scroll: Cinematic Reels / Clips Highlights */}
                {matchedPhotos.some(photo => photo.media_type === "VIDEO") && (
                  <section className="space-y-4">
                    <h3 className="font-title-md text-2xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-2xl">celebration</span>
                      Cinematic Video Clips
                    </h3>
                    <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
                      {matchedPhotos.filter(p => p.media_type === "VIDEO").map((photo) => (
                        <div 
                          key={photo.id} 
                          className="min-w-[280px] md:min-w-[340px] bg-surface-pure border border-outline-variant/20 rounded-3xl overflow-hidden shadow-sm flex flex-col"
                        >
                          <div className="relative aspect-video bg-black">
                            <video
                              id={`video-${photo.id}`}
                              src={getImageUrl(photo)}
                              className="w-full h-full object-cover"
                              controls
                              playsInline
                            />
                          </div>
                          {photo.timestamps && photo.timestamps.length > 0 && (
                            <div className="p-4 bg-surface-container-low flex flex-col gap-2 border-t border-outline-variant/10">
                              <span className="text-[10px] font-label-caps text-secondary font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                AI Found You At:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {photo.timestamps.sort((a, b) => a - b).map((ts, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => seekVideo(photo.id, ts)}
                                    className="text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2.5 py-1 rounded-md font-mono transition-colors"
                                  >
                                    {formatTime(ts)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Main Photos Grid */}
                <section className="space-y-6">
                  <h3 className="font-title-md text-2xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl font-normal">photo_library</span>
                    Photo Catalog
                  </h3>
                  <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {matchedPhotos.filter(p => p.media_type !== "VIDEO").map((photo, i) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="relative group rounded-3xl overflow-hidden bg-white border border-outline-variant/10 break-inside-avoid flex flex-col shadow-sm"
                      >
                        <div className="relative overflow-hidden group/image">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(photo)}
                            alt="Matched Memory"
                            className="w-full h-auto object-cover transition-transform duration-500 group-hover/image:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <a 
                              href={getImageUrl(photo)} 
                              download 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-semibold text-on-surface bg-white/90 backdrop-blur-md px-4 py-2 rounded-full hover:bg-white transition-colors"
                            >
                              View Original
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

              </div>
            )}
          </div>
        )}

      </div>

      {/* Reel customizer modal */}
      {isStudioOpen && matchedPhotos && (
        <>
          <MemoryReel 
            isOpen={true} 
            onClose={() => setIsStudioOpen(false)} 
            memories={matchedPhotos} 
            baseUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} 
            settings={reelSettings}
          />
          <div className="fixed top-24 left-6 bottom-6 z-[200] w-full max-w-sm shadow-2xl rounded-3xl overflow-hidden">
            <TemplateEditor
              settings={reelSettings}
              onChange={setReelSettings}
              onPlay={() => {}}
              onClose={() => setIsStudioOpen(false)}
            />
          </div>
        </>
      )}

    </div>
  );

  // Helper check
  function isSelfieFilesEmpty() {
    return selfieFiles.length === 0;
  }
}

export default function GuestJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <GuestJoinContent />
    </Suspense>
  );
}
