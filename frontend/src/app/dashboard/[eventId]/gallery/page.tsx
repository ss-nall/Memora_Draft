"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Loader2, Trash2, UploadCloud, Download, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoEditorModal } from "@/components/PhotoEditorModal";

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
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Media | null>(null);

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

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media? It will also remove all AI face data associated with it.")) return;
    
    try {
      await api.delete(`/media/${mediaId}`);
      setPhotos((prev) => prev.filter((p) => p.id !== mediaId));
      if (selectedMedia?.id === mediaId) {
        setSelectedMedia(null);
      }
    } catch (err) {
      console.error("Failed to delete media:", err);
      alert("Failed to delete the photo. Please try again.");
    }
  };

  const getImageUrl = (photo: Media) => {
    if (photo.cloudinary_url) return photo.cloudinary_url;
    const normalizedPath = photo.storage_url.replace(/\\/g, "/");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/${normalizedPath}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8 text-stone-900">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <Link
            href={`/dashboard/${eventId}`}
            className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Event Management
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Event Master Gallery
          </h1>
          <p className="text-xs text-stone-500">
            All {photos.length} indexed photos and video clips for this event.
          </p>
        </div>

        <Link href={`/dashboard/${eventId}`}>
          <Button size="sm" className="btn-accent text-xs font-semibold">
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Upload More Media
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#C25E2E]" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      ) : photos.length === 0 ? (
        <div className="glass-card text-center py-20 px-4 rounded-3xl border border-stone-200 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-[#C25E2E] mx-auto flex items-center justify-center mb-3">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">Gallery is empty</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-5">
            No photos or videos have been uploaded yet. Upload high-res media to begin AI face indexing.
          </p>
          <Link href={`/dashboard/${eventId}`}>
            <Button size="sm" className="btn-accent text-xs font-semibold">
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              Upload Photos
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              onClick={() => setSelectedMedia(photo)}
              className="group aspect-square relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs cursor-pointer"
            >
              {photo.media_type === "VIDEO" ? (
                <video
                  src={getImageUrl(photo)}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImageUrl(photo)}
                  alt="Event Asset"
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              )}

              {/* Hover Actions Bar */}
              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-between p-2.5 text-white">
                <span className="text-[9px] font-mono opacity-80 truncate max-w-[80px]">
                  {photo.id.split("-")[0]}
                </span>
                <div className="flex items-center gap-1">
                  <a
                    href={getImageUrl(photo)}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 bg-white/90 hover:bg-white text-stone-900 rounded-md transition-colors shadow-xs"
                    title="Download original"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Inspector Modal */}
      {selectedMedia && (
        <AnimatePresence>
          <div
            onClick={() => setSelectedMedia(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-stone-800 bg-stone-950/60">
                <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
                  <span>ID: {selectedMedia.id}</span>
                  {selectedMedia.uploader?.full_name && (
                    <span className="text-amber-400">Uploader: {selectedMedia.uploader.full_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedMedia.media_type !== "VIDEO" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPhoto(selectedMedia);
                        setSelectedMedia(null);
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      Open in Studio Editor
                    </button>
                  )}
                  <a
                    href={getImageUrl(selectedMedia)}
                    download
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(selectedMedia.id)}
                    className="p-2 bg-red-600/80 hover:bg-red-600 rounded-full text-white transition-colors cursor-pointer"
                    title="Delete media"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex items-center justify-center p-2 bg-stone-950">
                {selectedMedia.media_type === "VIDEO" ? (
                  <video
                    src={getImageUrl(selectedMedia)}
                    controls
                    autoPlay
                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getImageUrl(selectedMedia)}
                    alt="Event Asset Full Preview"
                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                  />
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Photo Studio Editor Modal */}
      {editingPhoto && (
        <PhotoEditorModal
          isOpen={true}
          onClose={() => setEditingPhoto(null)}
          imageUrl={getImageUrl(editingPhoto)}
          imageTitle={`Master_${editingPhoto.id.split("-")[0]}`}
        />
      )}

    </div>
  );
}
