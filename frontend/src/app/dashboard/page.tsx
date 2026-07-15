"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Plus, Users, Image as ImageIcon, Copy, Check, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CreateEventModal } from "@/components/CreateEventModal";
import Link from "next/link";

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

  useEffect(() => {
    fetchEvents();
  }, []);

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

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Events</h1>
          <p className="text-gray-400 mt-1">Manage your photography events and galleries.</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white/5 rounded-xl border border-white/10" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-white/20">
          <CardContent>
            <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Camera className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Create your first event to start uploading photos and sharing them with guests.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card hoverEffect className="h-full flex flex-col group border border-purple-500/10 hover:border-purple-500/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl truncate">{event.title}</CardTitle>
                  <div className="flex items-center text-sm text-gray-400 mt-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(event.date), "MMMM d, yyyy")}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {event.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="mt-auto space-y-4">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                        Invite Code
                      </div>
                      <button 
                        onClick={() => copyToClipboard(event.invite_code)}
                        className="flex items-center gap-2 text-sm font-mono text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {event.invite_code}
                        {copiedCode === event.invite_code ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/dashboard/${event.id}`} className="w-full">
                        <Button variant="secondary" className="w-full text-sm h-10">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </Link>
                      <Link href={`/dashboard/${event.id}/gallery`} className="w-full">
                        <Button variant="outline" className="w-full text-sm h-10">
                          View Gallery
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreateEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchEvents(); // Instantly refresh the events list!
        }}
      />
    </div>
  );
}
