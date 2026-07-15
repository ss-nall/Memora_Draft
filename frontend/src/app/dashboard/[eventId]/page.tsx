"use client";

import { useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, FileImage, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";

export default function EventUploadPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;
  
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

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
      setSuccessMessage(`Successfully uploaded and processed ${successCount} photos!`);
      setFiles([]);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="p-2 h-auto rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Photos</h1>
          <p className="text-gray-400 mt-1">AI will automatically detect faces and process vectors.</p>
        </div>
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
    </div>
  );
}
