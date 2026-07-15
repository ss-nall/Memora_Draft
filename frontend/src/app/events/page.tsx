"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image as ImageIcon, Loader2, Key, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";

interface MatchedPhoto {
  id: string;
  storage_url: string;
}

export default function GuestJoinPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[] | null>(null);

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelfieFile(e.target.files[0]);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selfieFile) {
      setError("Please select a selfie so we can find your photos!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selfieFile);

      const response = await api.post(`/guest/match/${inviteCode}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMatchedPhotos(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not find event or process selfie. Check your code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format backend path to valid frontend URL
  const getImageUrl = (storageUrl: string) => {
    // Replace Windows backslashes with forward slashes
    const normalizedPath = storageUrl.replace(/\\/g, '/');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/${normalizedPath}`;
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
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">Your Selfie</label>
                    <div className="relative">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--color-surface-border)] rounded-xl cursor-pointer bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {selfieFile ? (
                            <>
                              <ImageIcon className="w-8 h-8 mb-2 text-purple-400" />
                              <p className="text-sm text-purple-400 font-medium">{selfieFile.name}</p>
                            </>
                          ) : (
                            <>
                              <Camera className="w-8 h-8 mb-2 text-gray-400" />
                              <p className="text-sm text-gray-400">Click to upload selfie</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          capture="user"
                          onChange={handleSelfieSelect}
                        />
                      </label>
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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
              We Found You!
            </h1>
            <p className="text-xl text-gray-400">
              InsightFace AI matched you in {matchedPhotos.length} {matchedPhotos.length === 1 ? 'photo' : 'photos'}.
            </p>
          </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {matchedPhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="aspect-[4/5] relative group rounded-xl overflow-hidden bg-black/40 border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(photo.storage_url)}
                    alt="Matched Memory"
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
