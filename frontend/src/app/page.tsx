"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Scan, Sparkles, QrCode, ArrowRight, UploadCloud, Film, ShieldCheck, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [quickCode, setQuickCode] = useState("");
  const router = useRouter();

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      router.push(`/events?code=${encodeURIComponent(quickCode.trim().toUpperCase())}`);
    } else {
      router.push("/events");
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] px-4 sm:px-6 py-12 md:py-16 text-stone-900">
      
      {/* Hero Section */}
      <div className="max-w-4xl text-center space-y-4 md:space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-600/20 text-[#C25E2E] text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Event Photo & Video Discovery</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-stone-900 leading-[1.15]">
          Find yourself in every event photo. <br />
          <span className="text-[#C25E2E]">Instantly, with AI face matching.</span>
        </h1>

        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Memora indexes event photos and videos using neural facial embeddings. Organizers upload media in bulk; attendees scan their face to get their personal gallery and AI Memory Reel.
        </p>
      </div>

      {/* Two Clear Entry Points: Organizer vs Attendee */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        
        {/* Card 1: Attendee Portal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-6 sm:p-8 flex flex-col justify-between border border-stone-900/[0.08] relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E]">
              <Scan className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C25E2E] block">
                For Attendees & Guests
              </span>
              <h2 className="text-2xl font-bold text-stone-900 mt-1">
                Find Your Photos
              </h2>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              Scan your face with your device camera or upload a reference selfie. The system searches thousands of event photos and video clips to deliver only the moments you appear in.
            </p>

            {/* Quick Invite Code Form */}
            <form onSubmit={handleQuickJoin} className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Event Code (e.g. DEMO-2026)"
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                  className="flex-1 h-11 px-3.5 rounded-xl border border-stone-300 bg-white text-xs font-mono tracking-wider placeholder:font-sans placeholder:text-stone-400 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="submit"
                  className="h-11 px-4 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-stone-500">Quick Event:</span>
                <button
                  type="button"
                  onClick={() => setQuickCode("DEMO-2026")}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-[#C25E2E] border border-amber-600/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  DEMO-2026
                </button>
              </div>
            </form>
          </div>

          <div className="pt-6 border-t border-stone-100 mt-6 flex items-center justify-between text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Private & Direct Delivery
            </span>
            <Link href="/events" className="text-[#C25E2E] hover:underline">
              Open Scanner &rarr;
            </Link>
          </div>
        </motion.div>

        {/* Card 2: Organizer Portal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="glass-card p-6 sm:p-8 flex flex-col justify-between border border-stone-900/[0.08] relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                For Photographers & Hosts
              </span>
              <h2 className="text-2xl font-bold text-stone-900 mt-1">
                Host an Event
              </h2>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              Create an event, drag-and-drop hundreds of photos and videos, and generate printable QR code table cards so guests can access their memories seamlessly.
            </p>

            <div className="pt-2">
              <Link href="/dashboard" className="block w-full">
                <button
                  type="button"
                  className="w-full h-11 px-5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Organizer Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 mt-6 flex items-center justify-between text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-stone-600" />
              Instant QR Signage
            </span>
            <Link href="/dashboard" className="text-stone-800 hover:underline">
              Create Event &rarr;
            </Link>
          </div>
        </motion.div>

      </div>

      {/* Real Pipeline Architecture Section */}
      <div className="w-full max-w-4xl mt-20 pt-16 border-t border-stone-200/80 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-stone-900">
            How the AI Pipeline Works
          </h3>
          <p className="text-sm text-stone-500 max-w-lg mx-auto">
            A real-time, asynchronous media workflow powered by deep neural networks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="glass-card p-5 rounded-2xl border border-stone-900/[0.06] space-y-2.5">
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-bold font-mono text-stone-700">
              01
            </div>
            <h4 className="text-sm font-semibold text-stone-900">Bulk Media Upload</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Photographers upload RAW or JPEG files and video clips. Files are cataloged with EXIF metadata and orientation fix.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-stone-900/[0.06] space-y-2.5">
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-bold font-mono text-stone-700">
              02
            </div>
            <h4 className="text-sm font-semibold text-stone-900">Face Vector Indexing</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Celery workers run InsightFace to detect multi-angle faces and store 512-D vectors in a FAISS index.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-stone-900/[0.06] space-y-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-bold font-mono text-[#C25E2E]">
              03
            </div>
            <h4 className="text-sm font-semibold text-stone-900">1-Click Live Face Scan</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Attendee scans face with camera. FAISS runs cosine distance matching against the indexed event database.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-stone-900/[0.06] space-y-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-bold font-mono text-[#C25E2E]">
              04
            </div>
            <h4 className="text-sm font-semibold text-stone-900">Personal Memory Reel</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Matched photos, video highlights, and an animated AI Memory Reel are compiled and downloadable in 1 click.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
