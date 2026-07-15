"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";

interface Media {
  id: string;
  storage_url: string;
  media_type: string;
  created_at: string;
}

export default function EventGalleryPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;
  
  const [photos, setPhotos] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGallery();
  }, [eventId]);

  const fetchGallery = async () => {
    try {
      const response = await api.get(`/media/event/${eventId}`);
      setPhotos(response.data);
    } catch (err: any) {
      console.error("Failed to fetch gallery:", err);
      setError("Failed to load gallery photos.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format backend path to valid frontend URL
  const getImageUrl = (storageUrl: string) => {
    const normalizedPath = storageUrl.replace(/\\/g, '/');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/${normalizedPath}`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="p-2 h-auto rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Event Gallery</h1>
            <p className="text-gray-400 mt-1">All photos uploaded to this event.</p>
          </div>
        </div>
        <Link href={`/dashboard/${eventId}`}>
          <Button variant="outline">
            Upload More Photos
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      ) : photos.length === 0 ? (
        <Card className="text-center py-24 border-dashed border-white/20">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              This gallery is empty. Upload some photos to get started!
            </p>
            <Link href={`/dashboard/${eventId}`}>
              <Button>
                Upload Photos
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="aspect-square relative group rounded-xl overflow-hidden bg-black/40 border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(photo.storage_url)}
                alt="Event Photo"
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <span className="text-xs text-white font-mono opacity-50 truncate">
                  {photo.id.split('-')[0]}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
