"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";

interface Media {
  id: string;
  storage_url: string;
  cloudinary_url?: string;
  media_type: string;
  created_at: string;
  uploader?: {
    full_name: string;
  };
}

export default function EventGalleryPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;
  
  const [photos, setPhotos] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchGallery();
  }, [eventId]);

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media? It will also remove all AI face data associated with it.")) return;
    
    try {
      await api.delete(`/media/${mediaId}`);
      setPhotos((prev) => prev.filter(p => p.id !== mediaId));
    } catch (err) {
      console.error("Failed to delete media:", err);
      alert("Failed to delete the photo. Please try again.");
    }
  };

  const getImageUrl = (photo: Media) => {
    if (photo.cloudinary_url) return photo.cloudinary_url;
    const normalizedPath = photo.storage_url.replace(/\\/g, '/');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/${normalizedPath}`;
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen pt-32 pb-24 selection:bg-primary-fixed">
      
      {/* Viewport Wrapper */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-16 space-y-12">
        
        {/* Header Breadcrumb & Actions */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-outline-variant/20">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${eventId}`}>
              <Button variant="ghost" className="p-2.5 h-auto rounded-full text-secondary hover:text-on-surface hover:bg-surface-container">
                <ArrowLeft className="h-5 w-5 text-primary" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display-lg text-3xl font-bold tracking-tight text-on-surface">Event Gallery</h1>
              <p className="text-secondary text-sm">All media uploads cataloged under this event.</p>
            </div>
          </div>
          <Link href={`/dashboard/${eventId}`}>
            <Button className="rounded-full bg-primary hover:bg-primary-container text-white px-6 font-semibold">
              Upload More Photos
            </Button>
          </Link>
        </header>

        {/* Gallery Contents */}
        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-semibold text-center">
            {error}
          </div>
        ) : photos.length === 0 ? (
          
          /* Empty gallery placeholder card */
          <Card className="text-center py-24 border-dashed border-outline-variant/20 rounded-3xl bg-surface-pure">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">This gallery is empty</h3>
              <p className="text-secondary max-w-sm mx-auto text-sm leading-relaxed">
                No memories have been uploaded to this event catalog yet. Upload files to get started!
              </p>
              <div className="pt-2">
                <Link href={`/dashboard/${eventId}`}>
                  <Button className="rounded-full px-6">
                    Upload Photos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          
          /* Bento grid of media items */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                className="aspect-square relative group rounded-[24px] overflow-hidden bg-white border border-outline-variant/10 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(photo)}
                  alt="Event Photo"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Info Card on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                  <div className="flex flex-col flex-1 truncate mr-2 text-white">
                    <span className="text-[10px] font-mono opacity-60 truncate">
                      ID: {photo.id.split('-')[0]}
                    </span>
                    {photo.uploader?.full_name && (
                      <span className="text-[10px] uppercase font-label-caps text-primary-fixed mt-1 truncate">
                        By: {photo.uploader.full_name}
                      </span>
                    )}
                  </div>
                  
                  {/* Delete Action Trigger */}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500 text-white rounded-xl transition-colors backdrop-blur-md shrink-0 border border-red-500/30"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>

    </div>
  );
}
