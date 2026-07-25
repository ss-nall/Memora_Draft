"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Image as ImageIcon, Loader2, Key, ArrowLeft, Play, Clock, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Suspense } from "react";
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
  const [error, setError] = useState("");
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[] | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [reelSettings, setReelSettings] = useState<ReelSettings>(defaultSettings);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelfieFiles(Array.from(e.target.files));
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selfieFiles.length === 0) {
      setError("Please select at least one selfie so we can find your photos!");
      return;
    }

    setIsLoading(true);
    setError("");

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
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : "Could not find event or process selfie. Check your code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format backend path to valid frontend URL
  const getImageUrl = (photo: MatchedPhoto) => {
    if (photo.cloudinary_url) return photo.cloudinary_url;
    // Replace Windows backslashes with forward slashes
    const normalizedPath = photo.storage_url.replace(/\\/g, '/');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/${normalizedPath}`;
  };

  const handleDownloadAll = async () => {
    if (!matchedPhotos || matchedPhotos.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      // Fetch all images and add them to the zip
      const imagePromises = matchedPhotos.map(async (photo, index) => {
        const response = await fetch(getImageUrl(photo));
        const blob = await response.blob();
        // Extract original extension or default to .jpg
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center p-4 pt-12">
      <div className="w-full max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-4 text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      {!matchedPhotos ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="w-full border-purple-500/20 shadow-xl shadow-purple-500/5">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Find Your Photos</CardTitle>
              <p className="text-gray-400 text-sm mt-2">
                Enter the event code and snap a selfie. Our AI will instantly find every photo you are in!
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">Invite Code</label>
                    <Input
                      type="text"
                      placeholder="e.g. EVENT-12345"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      icon={<Key className="h-5 w-5" />}
                      required
                      className="font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center justify-between">
                      <span>Email Address <span className="text-gray-500 font-normal">(Optional)</span></span>
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter email to get notified of new photos"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">Your Selfie</label>
                    <div className="relative">
                      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--color-surface-border)] rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-8 h-8 mb-2 text-purple-400" />
                          <p className="text-sm font-medium">Upload Selfies</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            For best results, upload 1-3 selfies (Front, Left, Right)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-4">
                        <Button variant="outline" className="relative cursor-pointer" type="button">
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*"
                            multiple
                            onChange={handleSelfieSelect}
                          />
                          <Camera className="w-4 h-4 mr-2" />
                          Select Photos
                        </Button>
                        {selfieFiles.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {selfieFiles.length} file(s) selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-lg" isLoading={isLoading}>
                  Find My Memories
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-5xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
              We Found You!
            </h1>
            <p className="text-xl text-gray-400">
              InsightFace AI matched you in {matchedPhotos.length} {matchedPhotos.length === 1 ? 'photo' : 'photos'}.
            </p>
          </div>
          
            <div className="flex justify-end w-full mb-6 gap-3 flex-wrap">
              <Button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("access_token");
                    if (!token) {
                      alert("You must be logged in to become a contributor.");
                      router.push("/login");
                      return;
                    }
                    
                    // First we must get the event_id from the invite code. We can join the event to get it.
                    const joinRes = await api.post(`/events/${inviteCode}/join`);
                    const eventId = joinRes.data.event_id;
                    
                    // Request contributor
                    await api.post(`/events/${eventId}/request-contributor`);
                    setRequestStatus("Request Sent! Awaiting approval from the host.");
                  } catch (e: any) {
                    if (e.response?.data?.detail) {
                      setRequestStatus(e.response.data.detail);
                    } else {
                      setRequestStatus("Failed to submit request.");
                    }
                  }
                }} 
                variant="outline"
                className="shadow-lg border-purple-500/20 text-purple-400 hover:text-purple-300"
              >
                Become a Contributor
              </Button>
              <Button 
                onClick={() => setIsStudioOpen(true)} 
                variant="secondary"
                className="shadow-lg shadow-purple-500/10 border border-purple-500/20"
              >
                <Play className="w-4 h-4 mr-2" />
                Customize & Play Reel
              </Button>
              <Button 
                onClick={handleDownloadAll} 
                isLoading={isDownloading}
                className="shadow-lg shadow-purple-500/20"
              >
                Download All Memories (ZIP)
              </Button>
            </div>
            
            {requestStatus && (
              <div className="w-full text-center p-3 mb-6 bg-purple-500/10 text-purple-300 rounded-lg border border-purple-500/20">
                {requestStatus}
              </div>
            )}

          {matchedPhotos.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-white/20">
              <CardContent>
                <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Matches Found</h3>
                <p className="text-gray-400 mb-6">
                  We couldn't find you in this event's photos yet. The photographer might still be uploading!
                </p>
                <Button onClick={() => setMatchedPhotos(null)} variant="outline">
                  Try Another Selfie
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {matchedPhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative group rounded-xl overflow-hidden bg-black/40 border border-white/10 break-inside-avoid flex flex-col"
                >
                  {photo.media_type === "VIDEO" ? (
                    <div className="relative">
                      <video
                        id={`video-${photo.id}`}
                        src={getImageUrl(photo)}
                        className="w-full h-auto object-cover rounded-t-xl"
                        controls
                        playsInline
                      />
                      {photo.timestamps && photo.timestamps.length > 0 && (
                        <div className="p-3 bg-black/60 backdrop-blur-sm border-t border-white/10 flex flex-wrap gap-2">
                          <div className="w-full text-xs text-purple-400 font-semibold mb-1 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            AI Found You At:
                          </div>
                          {photo.timestamps.sort((a,b)=>a-b).map((ts, idx) => (
                            <button
                              key={idx}
                              onClick={() => seekVideo(photo.id, ts)}
                              className="text-xs bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 px-2 py-1 rounded transition-colors"
                            >
                              {formatTime(ts)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative group/image">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(photo)}
                        alt="Matched Memory"
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover/image:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
                        <a 
                          href={getImageUrl(photo)} 
                          download 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sm font-medium text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors pointer-events-auto"
                        >
                          View Original
                        </a>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {isStudioOpen && matchedPhotos && (
        <>
          <MemoryReel 
            isOpen={true} 
            onClose={() => setIsStudioOpen(false)} 
            memories={matchedPhotos} 
            baseUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} 
            settings={reelSettings}
          />
          <div className="fixed top-0 left-0 bottom-0 z-[200] w-full max-w-sm shadow-2xl">
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
}

export default function GuestJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
      <GuestJoinContent />
    </Suspense>
  );
}
