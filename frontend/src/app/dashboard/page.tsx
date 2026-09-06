"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, UploadCloud, QrCode, Calendar, Images, Sparkles, ArrowRight, Copy, Check, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CreateEventModal } from "@/components/CreateEventModal";
import { QRCodeModal } from "@/components/QRCodeModal";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  invite_code: string;
}

interface Analytics {
  active_events: number;
  asset_volume: number;
  recognition_accuracy: number;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrModalEvent, setQrModalEvent] = useState<{ id: string; title: string; invite_code: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsResponse, analyticsResponse] = await Promise.all([
        api.get("/events/"),
        api.get("/events/analytics").catch(() => ({
          data: { active_events: 0, asset_volume: 0, recognition_accuracy: 99.8 }
        }))
      ]);
      setEvents(eventsResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8 text-stone-900">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#C25E2E] mb-1">
            Host & Photography Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Organizer Dashboard
          </h1>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-accent shadow-sm text-xs font-semibold px-5 h-11 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </Button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Metric 1: Active Events */}
        <div className="glass-card p-6 border border-stone-900/[0.06] rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Total Events
          </span>
          <div className="text-4xl font-bold text-stone-900 my-2">
            {events.length}
          </div>
          <div className="text-[11px] text-stone-500">
            Managed galleries & active guest access
          </div>
        </div>

        {/* Metric 2: Asset Volume */}
        <div className="glass-card p-6 border border-stone-900/[0.06] rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Indexed Media Assets
          </span>
          <div className="text-4xl font-bold text-stone-900 my-2">
            {analytics?.asset_volume ?? 0}
          </div>
          <div className="text-[11px] text-stone-500">
            Photos & video clips processed in FAISS
          </div>
        </div>

        {/* Metric 3: AI Engine */}
        <div className="glass-card p-6 border border-stone-900/[0.06] rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Facial AI Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-4xl font-bold text-stone-900 my-2">
            512-D
          </div>
          <div className="text-[11px] text-stone-500">
            InsightFace Buffalo_L • Cosine Distance
          </div>
        </div>

      </div>

      {/* Events List Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900">
            Your Event Galleries
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            {events.length} {events.length === 1 ? "Event" : "Events"}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white/70 rounded-2xl border border-stone-200" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card text-center py-16 px-4 rounded-3xl border border-stone-200 border-dashed">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 text-[#C25E2E] mx-auto flex items-center justify-center mb-3">
              <Images className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-stone-900">No events created yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-5">
              Create an event to upload event photos and generate invite QR codes for your guests.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-accent text-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="glass-card p-6 rounded-2xl border border-stone-900/[0.08] shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* Event Title & Date */}
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        {event.date ? format(new Date(event.date), "MMM d, yyyy") : "Date TBD"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Invite Code Pill */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-stone-400 block font-semibold">
                          Invite Code
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-900 tracking-wider">
                          {event.invite_code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(event.invite_code)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Copy Invite Code"
                      >
                        {copiedCode === event.invite_code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Actions Grid */}
                <div className="pt-6 border-t border-stone-100 mt-6 flex items-center gap-2">
                  <Link href={`/dashboard/${event.id}`} className="flex-1">
                    <button
                      type="button"
                      className="w-full h-10 px-3 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Media</span>
                    </button>
                  </Link>

                  <Link href={`/dashboard/${event.id}/gallery`}>
                    <button
                      type="button"
                      className="h-10 px-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="View Full Gallery"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Gallery</span>
                    </button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setQrModalEvent({ id: event.id, title: event.title, invite_code: event.invite_code })}
                    className="h-10 w-10 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer shrink-0"
                    title="View QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchData();
        }}
      />

      {/* QR Code Signage Modal */}
      {qrModalEvent && (
        <QRCodeModal
          isOpen={true}
          onClose={() => setQrModalEvent(null)}
          eventName={qrModalEvent.title}
          inviteCode={qrModalEvent.invite_code}
        />
      )}

    </div>
  );
}
