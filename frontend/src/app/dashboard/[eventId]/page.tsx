"use client";

import { useState, useCallback, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, UploadCloud, FileImage, FileVideo, Loader2, CheckCircle2, 
  Printer, X, Trash2, Eye, Sparkles, AlertCircle, Copy, Check, Users, Clock,
  Upload, Camera
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api, { formatApiError } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

export default function EventUploadPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;
  const router = useRouter();
  
  const [eventData, setEventData] = useState<any>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await api.get(`/events/${eventId}`);
      setEventData(res.data);
    } catch (err) {
      console.error("Failed to fetch event data", err);
    }
  }, [eventId]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get(`/events/${eventId}/requests`);
      setRequests(res.data.filter((r: any) => r.status === "PENDING"));
    } catch (err: any) {
      if (err.response?.status !== 403) {
        console.warn("Failed to fetch contributor requests", err);
      }
    }
  }, [eventId]);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await api.get(`/media/event/${eventId}`);
      setMediaList(res.data);
    } catch (err) {
      console.error("Failed to fetch event media", err);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
    fetchRequests();
    fetchMedia();
  }, [fetchEvent, fetchRequests, fetchMedia]);

  const handleApproveRequest = async (reqId: string) => {
    try {
      await api.put(`/events/requests/${reqId}/approve`);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      setSuccessMessage("Contributor request approved! Guest can now upload event photos.");
    } catch (err) {
      console.error("Failed to approve request", err);
      setError("Failed to approve contributor request.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
      setSuccessMessage("");
      setError("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
      setSuccessMessage("");
      setError("");
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setIsProcessingQueue(false);
    setError("");
    setSuccessMessage("");

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFileName(file.name);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("event_id", eventId);

      try {
        await api.post("/media/upload", formData);
        successCount++;
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}`, err);
        if (err.response?.status === 401) {
          setError("Your session has expired or you are not signed in. Please sign in to upload photos.");
          setIsUploading(false);
          setTimeout(() => {
            router.push("/login");
          }, 2000);
          return;
        }
        const errorDetail = formatApiError(err, `Failed to upload ${file.name}`);
        setError(`${errorDetail}. Continuing with remaining files...`);
      }
    }

    setIsUploading(false);
    setCurrentFileName("");

    if (successCount > 0) {
      setSuccessMessage(`Successfully uploaded ${successCount} file(s)!`);
      setIsProcessingQueue(true);
      setFiles([]);
      setUploadProgress(0);
      fetchMedia();
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media? Associated face embeddings will also be removed.")) return;
    try {
      await api.delete(`/media/${mediaId}`);
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err) {
      console.error("Failed to delete media", err);
      alert("Failed to delete media file.");
    }
  };

  const getMediaUrl = (item: any) => {
    if (item.cloudinary_url) return item.cloudinary_url;
    const normalizedPath = item.storage_url.replace(/\\/g, "/");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/${normalizedPath}`;
  };

  const copyInviteCode = () => {
    if (eventData?.invite_code) {
      navigator.clipboard.writeText(eventData.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const joinLink = eventData
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/events?code=${eventData.invite_code}`
    : "";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8 text-stone-900">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            {eventData ? eventData.title : "Event Media Management"}
          </h1>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>Invite Code:</span>
            <button
              onClick={copyInviteCode}
              type="button"
              className="font-mono font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded border border-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {eventData?.invite_code || "..."}
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-500" />}
            </button>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {eventData && (
            <button
              type="button"
              onClick={() => setIsQRModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#C25E2E]" />
              Print QR Poster
            </button>
          )}
          <Link href={`/dashboard/${eventId}/gallery`}>
            <button
              type="button"
              className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-stone-600" />
              View Full Gallery ({mediaList.length})
            </button>
          </Link>
        </div>
      </div>

      {/* Contributor Requests Alert (if any) */}
      {requests.length > 0 && (
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-amber-300 bg-amber-50/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
            <Users className="w-4 h-4 text-[#C25E2E]" />
            <span>Pending Contributor Requests ({requests.length})</span>
          </div>
          <div className="divide-y divide-amber-200/60">
            {requests.map((req) => (
              <div key={req.id} className="pt-2 pb-2 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-stone-900">{req.user?.full_name || "Guest Attendee"}</span>
                  <span className="text-[11px] text-stone-500 block">{req.user?.email || "Requested upload access"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApproveRequest(req.id)}
                  className="px-3 py-1.5 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Approve Access
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Multi-file Uploader */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="glass-card border-2 border-dashed border-stone-300 hover:border-stone-400 p-8 sm:p-12 rounded-3xl flex flex-col items-center justify-center text-center transition-colors bg-white/70"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-[#C25E2E] flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-900">
          Drag and drop event photos and videos
        </h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-5">
          Supports JPEG, PNG, WEBP images and MP4, MOV video clips. Files are cataloged with EXIF orientation.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Choose Photos & Videos</span>
            <input
              type="file"
              className="sr-only"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>

          <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors">
            <Camera className="w-3.5 h-3.5 text-stone-600" />
            <span>Take Photo (Camera)</span>
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Selected Files Staging List */}
      {files.length > 0 && (
        <div className="glass-card p-5 sm:p-6 rounded-2xl border border-stone-900/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Selected Files ({files.length})
            </h4>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              size="sm"
              className="btn-accent text-xs font-semibold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Uploading ({uploadProgress}%)
                </>
              ) : (
                "Upload & Start AI Face Indexing"
              )}
            </Button>
          </div>

          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-stone-600 font-mono">
                <span className="truncate max-w-xs">{currentFileName || "Uploading..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
                <div
                  className="bg-[#C25E2E] h-full rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-800"
              >
                {file.type.startsWith("video/") ? (
                  <FileVideo className="w-4 h-4 text-purple-600 shrink-0" />
                ) : (
                  <FileImage className="w-4 h-4 text-[#C25E2E] shrink-0" />
                )}
                <span className="truncate flex-1 text-[11px]">{file.name}</span>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="text-stone-400 hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Async Processing Queue Indicator */}
      {isProcessingQueue && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-stone-800 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-stone-900">
            <Sparkles className="w-4 h-4 text-[#C25E2E]" />
            <span>Files Handed Off to Celery Face Detection Pipeline</span>
          </div>
          <p className="text-stone-600 text-[11px] leading-relaxed">
            Media files have been uploaded to cloud storage. Celery asynchronous workers are actively detecting multi-angle faces with InsightFace and generating 512-D vectors for FAISS indexing. Guests can now match their photos.
          </p>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Event Media Preview Grid */}
      <div className="space-y-4 pt-4 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900">
            Uploaded Media ({mediaList.length})
          </h3>
          <Link href={`/dashboard/${eventId}/gallery`} className="text-xs text-[#C25E2E] font-medium hover:underline">
            View all in Gallery &rarr;
          </Link>
        </div>

        {mediaList.length === 0 ? (
          <div className="text-center py-12 bg-white/60 rounded-2xl border border-stone-200 text-stone-500 text-xs">
            No media uploaded to this event yet. Use the uploader above to add photos and videos.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {mediaList.slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMediaUrl(item)}
                  alt="Event Asset"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-between p-2">
                  <span className="text-[9px] font-mono text-white opacity-80 truncate">
                    {item.id.split("-")[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(item.id)}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
                    title="Delete Media"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Event QR Poster Modal */}
      {isQRModalOpen && eventData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-stone-200/90 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-100 no-print">
              <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                Print Event Table Poster
              </span>
              <button
                type="button"
                onClick={() => setIsQRModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Poster Canvas */}
            <div id="print-area" className="p-8 sm:p-12 bg-white text-stone-900 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#C25E2E] mb-3">
                <Sparkles className="w-5 h-5" />
              </div>

              <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-2">
                {eventData.title}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-8">
                Scan the QR code with your phone camera to find your event photos instantly using AI face matching.
              </p>

              <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm mb-8">
                <QRCodeSVG
                  value={joinLink}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1 mb-8">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block">
                  Or enter invite code on Memora
                </span>
                <span className="text-2xl font-mono font-bold tracking-widest text-stone-900 bg-stone-50 px-5 py-2 rounded-xl border border-stone-200 inline-block">
                  {eventData.invite_code}
                </span>
              </div>

              <div className="w-full pt-6 border-t border-stone-100 flex justify-between text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                <span>1. Scan QR</span>
                <span>2. Snap Reference Face</span>
                <span>3. Get Personal Memories</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-stone-100 flex justify-end gap-2 bg-stone-50/50 no-print">
              <button
                type="button"
                onClick={() => setIsQRModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <Button
                onClick={() => window.print()}
                size="sm"
                className="btn-accent text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print Signage Poster
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
