"use client";

import { useState, useCallback, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, FileImage, FileVideo, Loader2, CheckCircle, Printer, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";

export default function EventUploadPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;
  
  const [eventData, setEventData] = useState<any>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

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
      // Filter out only pending ones
      setRequests(res.data.filter((r: any) => r.status === 'PENDING'));
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

  const handleApprove = async (reqId: string) => {
    try {
      await api.put(`/events/requests/${reqId}/approve`);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      setSuccessMessage("Contributor request approved!");
    } catch (err) {
      console.error("Failed to approve request", err);
      setError("Failed to approve request");
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

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError("");
    setSuccessMessage("");

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("event_id", eventId);

      try {
        await api.post("/media/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        successCount++;
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}`, err);
        setError(`Failed to upload some files. Please check the logs.`);
      }
    }

    setIsUploading(false);
    if (successCount === files.length) {
      setSuccessMessage(`Successfully uploaded and processed ${successCount} media files!`);
      setFiles([]);
      setUploadProgress(0);
    }
  };

  const joinLink = eventData ? `${typeof window !== 'undefined' ? window.location.origin : ''}/events?code=${eventData.invite_code}` : '';

  return (
    <div className="space-y-8 max-w-4xl mx-auto relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="p-2 h-auto rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload Media</h1>
            <p className="text-gray-400 mt-1">AI will automatically detect faces in photos and videos.</p>
          </div>
        </div>
        {eventData && (
          <Button onClick={() => setIsQRModalOpen(true)} variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
            <Printer className="mr-2 h-4 w-4" /> Print QR Poster
          </Button>
        )}
      </div>

      <Card className="border-dashed border-2 border-white/20 bg-black/20 hover:border-purple-500/50 transition-colors">
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-purple-500/10 rounded-full mb-4">
            <UploadCloud className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select photos to upload</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-sm">
            Drag and drop your high-resolution images here, or click to browse your files.
          </p>
          
          <label className="relative cursor-pointer">
            <Button asChild>
              <span>Browse Files</span>
            </Button>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">{files.length} Files Selected</h4>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading ({uploadProgress}%)
                </>
              ) : (
                "Start AI Processing"
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto pr-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
                <FileImage className="h-5 w-5 text-purple-400 shrink-0" />
                <span className="text-xs truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* QR Code Poster Modal */}
      {isQRModalOpen && eventData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header (Not Printed) */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 no-print">
              <h2 className="text-xl font-bold">Print Event Poster</h2>
              <Button variant="ghost" className="rounded-full p-2" onClick={() => setIsQRModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Poster Content (This area will be printed) */}
            <div id="print-area" className="p-8 md:p-12 bg-white text-black flex flex-col items-center justify-center min-h-[600px] text-center rounded-b-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight text-purple-900">
                {eventData.title}
              </h1>
              <p className="text-xl text-gray-600 mb-10 font-medium">
                Scan to join the event and see your photos!
              </p>
              
              <div className="bg-white p-6 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 mb-10">
                <QRCodeSVG
                  value={joinLink}
                  size={250}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>

              <div className="flex flex-col items-center gap-2 mb-8">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Or enter invite code</span>
                <span className="text-3xl font-mono font-bold bg-gray-100 px-6 py-3 rounded-xl border border-gray-200">
                  {eventData.invite_code}
                </span>
              </div>
              
              <div className="mt-auto pt-8 border-t border-gray-200 w-full flex justify-between items-center text-sm font-semibold text-gray-500 uppercase tracking-widest">
                <span>1. Scan QR</span>
                <span>2. Upload Selfie</span>
                <span>3. Find Photos</span>
              </div>
            </div>
            
            {/* Action Bar (Not Printed) */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-3 no-print">
              <Button variant="outline" onClick={() => setIsQRModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => window.print()} className="bg-purple-600 hover:bg-purple-700">
                <Printer className="mr-2 h-4 w-4" /> Print Poster
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
