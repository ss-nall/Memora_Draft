"use client";

import { QRCodeSVG } from "qrcode.react";
import { X, Download, QrCode, Copy, Check } from "lucide-react";
import { Button } from "./ui/Button";
import { useEffect, useState } from "react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  eventName: string;
}

export function QRCodeModal({ isOpen, onClose, inviteCode, eventName }: QRCodeModalProps) {
  const [url, setUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/events?code=${inviteCode}`;
    }
    return `http://localhost:3000/events?code=${inviteCode}`;
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && inviteCode) {
      setUrl(`${window.location.origin}/events?code=${inviteCode}`);
    }
  }, [inviteCode]);

  if (!isOpen) return null;

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 48;
      canvas.height = img.height + 48;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 24, 24);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${eventName}-QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyLink = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-stone-200/90 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col items-center p-6 sm:p-8 text-stone-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E] mb-3">
          <QrCode className="w-5 h-5" />
        </div>

        <h2 className="text-xl font-bold text-center text-stone-900">{eventName}</h2>
        <p className="text-stone-500 text-xs text-center mt-1 mb-6">
          Guests scan this QR code or enter the invite code to access their personalized photos.
        </p>

        {/* Clean White QR Container */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm mb-6 flex items-center justify-center">
          <QRCodeSVG
            id="qr-code-svg"
            value={url}
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Invite Code Display Box */}
        <div className="w-full bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Invite Code
            </div>
            <div className="text-xl font-mono text-stone-900 font-bold tracking-widest">
              {inviteCode}
            </div>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>
        </div>

        <Button onClick={downloadQR} className="w-full h-11 text-xs font-semibold btn-accent shadow-sm">
          <Download className="mr-2 h-4 w-4" />
          Download Printable QR Image
        </Button>
      </div>
    </div>
  );
}
