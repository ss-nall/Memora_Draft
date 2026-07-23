"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Plus, Users, Image as ImageIcon, Copy, Check, Camera, Compass, Share2, Settings, QrCode, TrendingUp, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CreateEventModal } from "@/components/CreateEventModal";
import { QRCodeModal } from "@/components/QRCodeModal";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  invite_code: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalEvent, setQrModalEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      const response = await api.get("/events/");
      setEvents(response.data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Compute mock stats based on actual event counts
  const totalParticipants = events.length * 14 + 120;
  const photosProcessed = events.length * 342 + 250;

  return (
    <div className="bg-surface text-on-surface font-body-md overflow-x-hidden min-h-screen pt-20">
      
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden lg:flex flex-col p-6 gap-6 h-screen w-64 fixed left-0 top-0 pt-28 bg-surface-pure border-r border-outline-variant/20 z-40">
        <div className="mb-4">
          <span className="font-display-lg text-title-md text-primary font-bold">Memories</span>
        </div>
        <div className="space-y-2">
          <a className="flex items-center gap-3 p-3 text-primary font-bold bg-secondary-container rounded-xl transition-all" href="#">
            <span className="material-symbols-outlined text-[20px] font-normal" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
            <span className="text-sm font-semibold">Events Hub</span>
          </a>
          <a className="flex items-center gap-3 p-3 text-secondary font-medium hover:bg-surface-container transition-all rounded-xl" href="#">
            <span className="material-symbols-outlined text-[20px]">auto_awesome_motion</span>
            <span className="text-sm font-medium">Collections</span>
          </a>
          <a className="flex items-center gap-3 p-3 text-secondary font-medium hover:bg-surface-container transition-all rounded-xl" href="#">
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span className="text-sm font-medium">Shared Files</span>
          </a>
          <a className="flex items-center gap-3 p-3 text-secondary font-medium hover:bg-surface-container transition-all rounded-xl" href="#">
            <span className="material-symbols-outlined text-[20px]">psychology</span>
            <span className="text-sm font-medium">AI Studio</span>
          </a>
          <Link href="/notifications" className="flex items-center gap-3 p-3 text-secondary font-medium hover:bg-surface-container transition-all rounded-xl">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm font-medium">Updates</span>
          </Link>
        </div>
        <div className="mt-auto pt-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-4 px-4 bg-on-surface text-surface-pure rounded-full font-label-caps tracking-widest text-xs hover:scale-[1.02] active:scale-95 duration-200 transition-all font-bold shadow-md"
          >
            CREATE NEW EVENT
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="lg:ml-64 pb-24 px-6 md:px-16 max-w-[1440px] pt-8">
        
        {/* Header & Stats Banner */}
        <ScrollReveal>
          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-display-lg text-4xl sm:text-5xl font-bold tracking-tight text-on-surface mb-2">Events Hub</h1>
                <p className="font-body-lg text-secondary">Real-time event management and media processing dashboard.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold transition-all ease-out-expo hover:scale-[1.02] active:scale-95 shadow-md shadow-primary/10 hover:shadow-primary/20"
                >
                  Create Event
                </button>
              </div>
            </div>

            {/* Statistical Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              
              {/* Stat 1 */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between h-36">
                <span className="text-[10px] font-label-caps text-secondary font-bold tracking-wider">TOTAL ESTIMATED PARTICIPANTS</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-title-lg text-3xl font-extrabold">{totalParticipants}</span>
                  <span className="text-primary font-medium text-xs flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +12%
                  </span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between h-36">
                <span className="text-[10px] font-label-caps text-secondary font-bold tracking-wider">AI ENHANCED IMAGES</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-title-lg text-3xl font-extrabold">{photosProcessed}</span>
                  <span className="text-secondary text-xs">processed across catalog</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between h-36 relative overflow-hidden">
                <span className="text-[10px] font-label-caps text-secondary font-bold tracking-wider">STORAGE UTILIZATION</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-title-lg text-3xl font-extrabold">64%</span>
                  <span className="text-secondary text-xs">128.5 GB utilized</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-primary" style={{ width: "64%" }} />
              </div>

            </div>
          </header>
        </ScrollReveal>

        {/* Graph & Activity block */}
        <ScrollReveal delay={0.1}>
          <section className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-title-md text-lg font-bold">Upload Activity</h3>
                <span className="text-[10px] font-label-caps text-secondary font-semibold uppercase tracking-wider">Last 24 Hours</span>
              </div>
              <div className="h-48 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#bc0100" stopOpacity="0.12"></stop>
                      <stop offset="100%" stopColor="#bc0100" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path d="M0,150 Q100,120 200,160 T400,80 T600,120 T800,40 L800,200 L0,200 Z" fill="url(#chartGradient)"></path>
                  <path d="M0,150 Q100,120 200,160 T400,80 T600,120 T800,40" fill="none" stroke="#bc0100" strokeLinecap="round" strokeWidth="3"></path>
                  <circle cx="200" cy="160" fill="#bc0100" r="4"></circle>
                  <circle cx="400" cy="80" fill="#bc0100" r="4"></circle>
                  <circle cx="600" cy="120" fill="#bc0100" r="4"></circle>
                </svg>
              </div>
            </div>

            {/* Processing side card */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
              <h3 className="font-title-md text-lg font-bold">Model Engine Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="font-semibold text-on-surface">Face Identification</span>
                    <span className="text-secondary font-bold font-mono">99.8%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "99.8%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="font-semibold text-on-surface">Vector Index Space</span>
                    <span className="text-secondary font-bold font-mono">82%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "82%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Dynamic Events Grid */}
        <ScrollReveal delay={0.2}>
          <section className="space-y-6">
            <h3 className="font-title-md text-2xl font-bold tracking-tight">Your Events</h3>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-surface-container rounded-3xl border border-outline-variant/10" />
                ))}
              </div>
            ) : events.length === 0 ? (
              
              /* No Events Placholder */
              <Card className="text-center py-20 border-dashed border-outline-variant/20 rounded-3xl bg-surface-pure">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">No Events Created</h3>
                  <p className="text-secondary max-w-sm mx-auto text-sm">
                    Create your first event catalog to start uploading photos and sharing customized memory reels with guests.
                  </p>
                  <div className="pt-2">
                    <Button onClick={() => setIsModalOpen(true)} className="rounded-full px-6">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              
              /* Events Cards listing */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="glass-panel p-6 rounded-3xl flex flex-col justify-between h-[300px] border border-outline-variant/15 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-title-md text-xl font-bold text-on-surface truncate flex-1">{event.title}</h4>
                        <ChevronRight className="w-5 h-5 text-secondary shrink-0" />
                      </div>
                      <div className="flex items-center text-xs text-secondary font-semibold font-mono">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        {format(new Date(event.date), "MMMM d, yyyy")}
                      </div>
                      {event.description && (
                        <p className="text-xs text-secondary line-clamp-3 leading-relaxed mt-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                      <div className="bg-surface-container-low/60 p-3 rounded-2xl flex items-center justify-between border border-outline-variant/10">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-label-caps text-secondary font-bold tracking-wider">Invite Code</span>
                          <button 
                            onClick={() => copyToClipboard(event.invite_code)}
                            className="flex items-center gap-1.5 text-sm font-mono text-primary font-bold mt-0.5 hover:underline"
                          >
                            {event.invite_code}
                            {copiedCode === event.invite_code ? (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-secondary" />
                            )}
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full border border-outline-variant/30 text-xs px-3 h-8 bg-surface-pure hover:bg-surface-container"
                          onClick={() => setQrModalEvent(event)}
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1 text-primary" /> QR Code
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/dashboard/${event.id}`} className="flex-1">
                          <Button variant="secondary" className="w-full text-xs font-semibold rounded-full h-9 hover:bg-surface-container">
                            Upload Photos
                          </Button>
                        </Link>
                        <Link href={`/dashboard/${event.id}/gallery`} className="flex-1">
                          <Button variant="outline" className="w-full text-xs font-semibold rounded-full h-9 hover:bg-surface-container">
                            View Gallery
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </ScrollReveal>

      </main>

      <CreateEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchEvents();
        }}
      />
      
      {qrModalEvent && (
        <QRCodeModal
          isOpen={!!qrModalEvent}
          onClose={() => setQrModalEvent(null)}
          inviteCode={qrModalEvent.invite_code}
          eventName={qrModalEvent.title}
        />
      )}
    </div>
  );
}
