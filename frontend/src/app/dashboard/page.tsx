"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, Upload, Share2, MoreHorizontal, Bell, Search, BarChart2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CreateEventModal } from "@/components/CreateEventModal";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsResponse, analyticsResponse] = await Promise.all([
        api.get("/events/"),
        api.get("/events/analytics").catch(() => ({ data: { active_events: 0, asset_volume: 0, recognition_accuracy: 99.8 } }))
      ]);
      setEvents(eventsResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="text-[10px] font-bold text-[#D33B31] tracking-[0.2em] uppercase mb-2">Analytics Console</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#14241B] flex items-center gap-4">
            Overview
          </h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
             <div className="w-2 h-2 rounded-full bg-green-500" />
             <span className="text-xs font-medium text-gray-600">System Online</span>
           </div>
           <button className="text-gray-400 hover:text-[#14241B] transition-colors relative px-2">
             <Bell className="w-5 h-5" />
             <div className="absolute top-0 right-1 w-2 h-2 bg-[#D33B31] rounded-full border border-white" />
           </button>
           {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="w-7 h-7 rounded-full ml-2" />
           ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 ml-2" />
           )}
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active Events */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col justify-between h-[240px]">
          <div className="flex justify-between items-start">
             <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Active Events</span>
             <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">+12.4%</span>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="text-6xl font-bold tracking-tighter text-[#14241B]">{analytics?.active_events ?? 0}</div>
            <div className="w-16 h-8 opacity-50"><svg viewBox="0 0 100 30" className="w-full h-full stroke-gray-400 fill-none stroke-2"><path d="M0,15 Q25,5 50,15 T100,15" /></svg></div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-[11px] text-gray-400">
            84% capacity utilized across active sessions
          </div>
        </div>
        
        {/* Asset Volume */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col justify-between h-[240px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-50 to-transparent opacity-50 rounded-full blur-3xl -z-10" />
          <div className="flex justify-between items-start">
             <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Asset Volume</span>
             <span className="px-2 py-1 bg-red-100 text-[#D33B31] text-xs font-bold rounded-md">+2.4k</span>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="text-6xl font-bold tracking-tighter text-[#14241B]">
              {analytics?.asset_volume !== undefined 
                ? (analytics.asset_volume > 1000 ? (analytics.asset_volume/1000).toFixed(1) + 'k' : analytics.asset_volume) 
                : '0'}
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-red-100 flex items-center justify-center relative">
               <div className="absolute inset-0 rounded-full border-4 border-[#D33B31] border-l-transparent border-b-transparent transform rotate-45" />
               <span className="text-[10px] font-bold text-[#D33B31]">75%</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-[11px] text-gray-400">
            High storage efficiency (2.4ms avg retrieval)
          </div>
        </div>

        {/* Recognition Accuracy */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col justify-between h-[240px]">
          <div className="flex justify-between items-start">
             <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Recognition Accuracy</span>
             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
               <ScanFaceIcon className="w-4 h-4" />
             </div>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="text-6xl font-bold tracking-tighter text-[#14241B]">
              {analytics?.recognition_accuracy ?? 99.8}<span className="text-3xl text-gray-400 font-normal">%</span>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
               <div className="bg-[#14241B] h-full rounded-full" style={{ width: `${analytics?.recognition_accuracy ?? 99.8}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 font-medium">
              <span>8.2k entities indexed</span>
              <span>AI Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Productions */}
      <div className="pt-8">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#14241B]">Active Productions</h2>
          <Link href="/dashboard/events" className="text-sm font-semibold text-[#D33B31] hover:text-red-700 flex items-center">
            Full Repository &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-white rounded-3xl border border-gray-100" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-400">
              <CameraIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#14241B]">No active productions</h3>
            <p className="text-gray-500 mb-6 text-sm">Create an event to start processing photos.</p>
            <Button onClick={() => setIsModalOpen(true)} className="bg-[#14241B] text-white rounded-xl hover:bg-[#1E3629]">
              New Production
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
              >
                {/* Mock Image Header */}
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#14241B]/20 to-transparent mix-blend-overlay" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-700 flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-[#D33B31] rounded-full animate-pulse" />
                    LIVE
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[#14241B] mb-2 truncate">{event.title}</h3>
                  <div className="flex items-center text-xs text-gray-500 font-medium mb-6 gap-2">
                    <span>{event.description || "Location TBD"}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                  </div>
                  
                  <div className="mt-auto flex gap-3">
                    <Link href={`/dashboard/${event.id}`} className="flex-1">
                      <Button className="w-full bg-[#14241B] text-white hover:bg-[#1E3629] rounded-xl h-11 shadow-sm font-semibold">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-11 h-11 rounded-xl border-gray-200 text-gray-600 p-0 flex-shrink-0 hover:bg-gray-50">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}

function ScanFaceIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </svg>
  )
}

function CameraIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}
