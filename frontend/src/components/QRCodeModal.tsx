import { QRCodeSVG } from "qrcode.react";
import { X, Download } from "lucide-react";
import { Button } from "./ui/Button";
import { useEffect, useState } from "react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  eventName: string;
}

export function QRCodeModal({ isOpen, onClose, inviteCode, eventName }: QRCodeModalProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
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
      // Add padding and background
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${eventName}-QR.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col items-center p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-2">{eventName}</h2>
        <p className="text-gray-400 text-center mb-8">Scan to join the event and find your photos!</p>

        <div className="bg-white p-4 rounded-xl mb-8">
          <QRCodeSVG
            id="qr-code-svg"
            value={url}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="w-full bg-black/20 p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center mb-6">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
            Invite Code
          </div>
          <div className="text-2xl font-mono text-purple-400 tracking-[0.2em] font-bold">
            {inviteCode}
          </div>
        </div>

        <Button onClick={downloadQR} className="w-full h-12 text-lg">
          <Download className="mr-2 h-5 w-5" />
          Download QR Code
        </Button>
      </div>
    </div>
  );
}
