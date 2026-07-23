"use client";

import { useState, useCallback, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, FileImage, Loader2, CheckCircle, Printer, X, Trash2, Calendar, MapPin, Plus, Copy, Check, Users, Clock, Settings, BarChart3, UserX, UserCheck, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";

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
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // New core features state variables
  const [activeTab, setActiveTab] = useState("media");
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRetention, setEditRetention] = useState("30");
  const [isSavingEvent, setIsSavingEvent] = useState(false);

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

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const res = await api.get(`/events/${eventId}/members`);
      setMembers(res.data);
    } catch (err) {
      console.warn("Failed to fetch event members", err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
    fetchRequests();
    fetchMedia();
    fetchMembers();
  }, [fetchEvent, fetchRequests, fetchMedia, fetchMembers]);

  useEffect(() => {
    if (eventData) {
      setEditTitle(eventData.title || "");
      setEditDate(eventData.date ? eventData.date.substring(0, 10) : "");
      setEditDescription(eventData.description || "");
    }
  }, [eventData]);

  const handleApprove = async (reqId: string) => {
    try {
      await api.put(`/events/requests/${reqId}/approve`);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      setSuccessMessage("Contributor request approved!");
      fetchMembers(); // refresh members list
    } catch (err) {
      console.error("Failed to approve request", err);
      setError("Failed to approve request");
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await api.put(`/events/requests/${reqId}/reject`);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      setSuccessMessage("Contributor request rejected!");
    } catch (err) {
      console.error("Failed to reject request", err);
      setError("Failed to reject request");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the event?")) return;
    try {
      await api.delete(`/events/${eventId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
      setSuccessMessage("Member removed successfully!");
    } catch (err) {
      console.error("Failed to remove member", err);
      setError("Failed to remove member");
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEvent(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await api.put(`/events/${eventId}`, {
        title: editTitle,
        date: new Date(editDate).toISOString(),
        description: editDescription || null
      });
      setEventData(res.data);
      setSuccessMessage("Event settings updated successfully!");
    } catch (err) {
      console.error("Failed to update event settings", err);
      setError("Failed to update event settings");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to delete this event? This will delete the event and all associated media, faces, and attendee records permanently! This action CANNOT be undone.")) return;
    try {
      await api.delete(`/events/${eventId}`);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to delete event", err);
      setError("Failed to delete event");
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
      fetchMedia(); // Refresh media gallery
    }
  };

  const copyToClipboard = () => {
    if (!eventData) return;
    const joinLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/events?code=${eventData.invite_code}`;
    navigator.clipboard.writeText(joinLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formattedDate = eventData?.date ? new Date(eventData.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }) : "Pending Date";

  return (
    <div className="bg-surface text-on-surface font-body-md overflow-x-hidden min-h-screen pt-20">
      
      {/* Immersive Cover Header */}
      <section className="relative w-full h-[360px] px-6 md:px-16 pt-6">
        <div className="w-full h-full rounded-[32px] overflow-hidden relative shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            className="w-full h-full object-cover" 
            alt="Event Cover Graphic"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl6qqrJAPYmprrMj_CSOLf2-RZUlVSl5HU6gTt7QBqVkLKrmpeNPA6T9BY7D1RTXXczB1Uhktvls5-w7tw2go9UCdPJDlEdbIkLmOwWtxnlZY0imAy2kAk1TWC-Tw5LKNPq2n8KcdUtN2UaWJEOzlWFkEq-ADuMTf-92mgGbJFIEL_GkBkkxUQX3GQ-YQqqkOlRCpFQxZwm6nMLI2h7R_NDCxH-VpwZDkn_SPa1-GweoM4pXzzHNUeeVxRBmxcqvmPUQAy7IccLoxX"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          
          <Link href="/dashboard" className="absolute top-6 left-6 flex items-center gap-2 bg-glass-fill px-4 py-2 rounded-full border border-white/20 hover:bg-white transition-colors text-xs font-label-caps uppercase tracking-wider text-secondary hover:text-on-surface">
            <ArrowLeft className="w-4 h-4 text-primary" />
            Back to Dashboard
          </Link>
        </div>
      </section>

      {/* Content Layout */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col lg:flex-row gap-12 -mt-24 relative z-10 pb-24">
        
        {/* Left column: Event stats, narrative and requests */}
        <div className="flex-grow flex flex-col gap-10">
          
          {/* Main Info Card */}
          <div className="reveal active bg-surface-pure rounded-[24px] p-8 shadow-soft border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary/10 text-primary text-[10px] font-label-caps uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                LIVE PROCESSING
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[10px] font-label-caps text-secondary font-bold uppercase tracking-wider">AI index active</span>
              </div>
            </div>
            
            <h1 className="font-display-lg text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              {eventData?.title || "Loading Event..."}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-secondary">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Memora Studio Event</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-outline-variant/15 gap-8 mt-2 pb-px overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab("media")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${activeTab === "media" ? "border-primary text-primary" : "border-transparent text-secondary hover:text-on-surface"}`}
            >
              <FileImage className="w-4 h-4" />
              Media & Timeline
            </button>
            <button 
              onClick={() => { setActiveTab("members"); fetchMembers(); }}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${activeTab === "members" ? "border-primary text-primary" : "border-transparent text-secondary hover:text-on-surface"}`}
            >
              <Users className="w-4 h-4" />
              Attendees ({members.length})
            </button>
            <button 
              onClick={() => setActiveTab("requests")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${activeTab === "requests" ? "border-primary text-primary" : "border-transparent text-secondary hover:text-on-surface"}`}
            >
              <UserCheck className="w-4 h-4" />
              Requests ({requests.length})
            </button>
            <button 
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${activeTab === "analytics" ? "border-primary text-primary" : "border-transparent text-secondary hover:text-on-surface"}`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab("settings")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${activeTab === "settings" ? "border-primary text-primary" : "border-transparent text-secondary hover:text-on-surface"}`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* Tab Content Panels */}
          {activeTab === "media" && (
            <div className="flex flex-col gap-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="p-6 bg-surface-container-low rounded-2xl flex flex-col gap-1 border border-outline-variant/5 shadow-sm">
                  <span className="text-[10px] font-label-caps text-secondary font-bold">TOTAL MEMORIES</span>
                  <span className="font-title-lg text-2xl font-extrabold">{mediaList.length}</span>
                </div>
                <div className="p-6 bg-surface-container-low rounded-2xl flex flex-col gap-1 border border-outline-variant/5 shadow-sm">
                  <span className="text-[10px] font-label-caps text-secondary font-bold">PENDING REQUESTS</span>
                  <span className="font-title-lg text-2xl font-extrabold">{requests.length}</span>
                </div>
                <div className="p-6 bg-surface-container-low rounded-2xl flex flex-col gap-1 border border-outline-variant/5 shadow-sm">
                  <span className="text-[10px] font-label-caps text-secondary font-bold">INVITE CODE</span>
                  <span className="font-title-lg text-lg font-bold font-mono text-primary truncate uppercase">{eventData?.invite_code || "---"}</span>
                </div>
              </div>

              {/* Event Narrative timeline */}
              <div className="flex flex-col gap-6">
                <h2 className="font-display-lg text-2xl font-bold tracking-tight">Event Timeline & Details</h2>
                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/30 pl-2">
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1.5 w-8 h-8 bg-surface-pure rounded-full border-2 border-primary flex items-center justify-center z-10">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-title-md text-lg font-semibold">18:00 — Welcome Cocktail</h3>
                    <p className="text-secondary mt-1 text-sm">Guests arrive and scan QR poster. Face recognition indexing starts automatically.</p>
                  </div>
                  <div className="relative pl-10 opacity-70">
                    <div className="absolute left-0 top-1.5 w-8 h-8 bg-surface-pure rounded-full border-2 border-outline-variant flex items-center justify-center z-10">
                      <Clock className="w-4 h-4 text-secondary" />
                    </div>
                    <h3 className="font-title-md text-lg font-semibold">20:00 — Dinner Speeches</h3>
                    <p className="text-secondary mt-1 text-sm">Main captures and group photo reels mapped directly to guest profiles.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="glass-panel p-6 rounded-[24px] space-y-4">
              <h3 className="font-title-md text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Attendees List
              </h3>
              
              {isLoadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-10 text-secondary text-sm">
                  No attendees have joined this event yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.user.id} className="flex justify-between items-center p-4 bg-surface-pure rounded-xl border border-outline-variant/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {member.user.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-on-surface">{member.user.full_name}</p>
                          <p className="text-xs text-secondary">{member.user.email}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleRemoveMember(member.user.id)}
                        className="rounded-full bg-transparent hover:bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-semibold px-4 py-1.5 h-8"
                      >
                        <UserX className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="glass-panel p-6 rounded-[24px] space-y-4">
              <h3 className="font-title-md text-xl font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Pending Contributors ({requests.length})
              </h3>
              {requests.length === 0 ? (
                <div className="text-center py-10 text-secondary text-sm">
                  No pending contributor requests at the moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="flex justify-between items-center p-4 bg-surface-pure rounded-xl border border-outline-variant/10">
                      <div>
                        <p className="font-semibold text-sm text-on-surface">{req.guest_email || "Anonymous Guest"}</p>
                        <span className="text-[10px] font-label-caps text-secondary uppercase font-bold">Wants contributor status</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(req.id)}
                          className="rounded-full bg-primary hover:bg-primary-container text-white px-4 text-xs font-semibold"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReject(req.id)}
                          className="rounded-full border-red-500/20 hover:bg-red-500/10 text-red-500 px-4 text-xs font-semibold"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="glass-panel p-6 rounded-[24px] flex flex-col justify-between h-40">
                <span className="text-[10px] font-label-caps text-secondary font-bold tracking-wider">AI RECOGNITION ACCURACY</span>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f1f2" strokeWidth="4" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#bc0100" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - 0.998)}`} />
                    </svg>
                    <span className="absolute text-xs font-bold font-mono">99.8%</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-on-surface">InsightFace Core</h4>
                    <p className="text-secondary text-xs mt-0.5">512-dim embedding distance metric</p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass-panel p-6 rounded-[24px] flex flex-col justify-between h-40">
                <span className="text-[10px] font-label-caps text-secondary font-bold tracking-wider">MEDIA BREAKDOWN</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold font-mono">{mediaList.filter(m => m.media_type === "IMAGE" || !m.media_type).length}</span>
                    <span className="text-[9px] uppercase font-label-caps text-secondary font-bold">Photos</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold font-mono">{mediaList.filter(m => m.media_type === "VIDEO").length}</span>
                    <span className="text-[9px] uppercase font-label-caps text-secondary font-bold">Videos</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass-panel p-6 rounded-[24px] flex flex-col justify-between h-40">
                <span className="text-[10px] font-label-caps text-secondary font-bold tracking-wider">ESTIMATED STORAGE</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-title-lg text-3xl font-extrabold">{(mediaList.length * 2.4).toFixed(1)} MB</span>
                  <span className="text-secondary text-xs">across {mediaList.length} items</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="glass-panel p-6 rounded-[24px] flex flex-col justify-between h-40">
                <span className="text-[10px] font-label-caps text-secondary font-bold tracking-wider">ENGAGEMENT RATIO</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-title-lg text-3xl font-extrabold">{members.length > 0 ? (mediaList.length / members.length).toFixed(1) : "0.0"}</span>
                  <span className="text-secondary text-xs">uploads per member</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="glass-panel p-6 rounded-[24px] space-y-6">
              <h3 className="font-title-md text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Event Settings
              </h3>
              
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-secondary uppercase font-label-caps block mb-1.5">Event Title</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface-container rounded-2xl border border-outline-variant/15 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary uppercase font-label-caps block mb-1.5">Event Date</label>
                  <input 
                    type="date" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface-container rounded-2xl border border-outline-variant/15 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary uppercase font-label-caps block mb-1.5">Event Description / Narrative</label>
                  <textarea 
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-surface-container rounded-2xl border border-outline-variant/15 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary uppercase font-label-caps block mb-1.5">Location Mock</label>
                  <input 
                    type="text" 
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container rounded-2xl border border-outline-variant/15 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary uppercase font-label-caps block mb-1.5">Retention Period (Days)</label>
                  <input 
                    type="number" 
                    value={editRetention}
                    onChange={(e) => setEditRetention(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container rounded-2xl border border-outline-variant/15 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={isSavingEvent}
                    className="rounded-full bg-primary hover:bg-primary-container text-white px-6 font-bold text-sm h-11"
                  >
                    {isSavingEvent ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>

              <div className="border-t border-outline-variant/10 pt-6 mt-6">
                <h4 className="font-semibold text-red-500 text-sm uppercase font-label-caps tracking-wider block mb-2">Danger Zone</h4>
                <p className="text-xs text-secondary mb-4 leading-relaxed">
                  Deleting this event will remove all media files, Face embeddings index catalogs, and invite codes permanently from Memora servers. This action cannot be undone.
                </p>
                <Button 
                  onClick={handleDeleteEvent}
                  className="rounded-full bg-transparent hover:bg-red-500/10 text-red-500 border border-red-500/30 text-xs font-semibold px-6 py-2.5 h-10"
                >
                  Delete Event permanently
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Right column: Floating panel for upload actions */}
        <aside className="w-full lg:w-[400px] shrink-0">
          <div className="sticky top-28 bg-surface-pure rounded-[24px] border border-outline-variant/10 shadow-soft p-6 flex flex-col gap-6">
            
            {/* Invite card options */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-secondary uppercase font-label-caps tracking-wider">Event Invites</h4>
              <div className="flex gap-2">
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1 rounded-full h-10 text-xs font-semibold"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> Copied Link
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5 text-primary" /> Copy Invite Link
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setIsQRModalOpen(true)}
                  variant="outline"
                  className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
                  title="Generate QR Poster"
                >
                  <Printer className="w-4 h-4 text-secondary" />
                </Button>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="border-t border-outline-variant/15 pt-6 space-y-4">
              <h4 className="font-semibold text-sm text-secondary uppercase font-label-caps tracking-wider">Upload Media</h4>
              
              <div className="border-2 border-dashed border-outline-variant/20 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors p-8 text-center relative cursor-pointer group">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <UploadCloud className="w-10 h-10 text-primary mx-auto mb-2 group-hover:scale-105 duration-300" />
                <p className="text-sm font-semibold">Drop images here</p>
                <p className="text-xs text-secondary mt-1">Accepts JPG, PNG, WEBP, MP4</p>
              </div>
            </div>

            {/* Selected files info */}
            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-on-surface">{files.length} Files Selected</span>
                  <button onClick={() => setFiles([])} className="text-primary hover:underline font-semibold">Clear</button>
                </div>

                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 border border-outline-variant/10 rounded-xl p-3 bg-surface-container-low/40">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-secondary truncate">
                      <FileImage className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>

                {isUploading && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-[10px] uppercase font-label-caps text-secondary font-bold tracking-wider">
                      Uploading... {uploadProgress}%
                    </span>
                  </div>
                )}

                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="w-full rounded-full h-11 bg-primary hover:bg-primary-container text-white font-bold"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                      Uploading...
                    </>
                  ) : (
                    "Start AI Processing"
                  )}
                </Button>
              </div>
            )}

            {/* Alert messages */}
            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-xs rounded-xl font-semibold text-center">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-semibold text-center">
                {error}
              </div>
            )}

            {/* QR Inline Preview inside panel */}
            {eventData && (
              <div className="border-t border-outline-variant/15 pt-6 text-center space-y-3">
                <span className="text-[10px] font-label-caps text-secondary font-bold uppercase tracking-wider block">QR Flyer Preview</span>
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/10 inline-block shadow-sm">
                  <QRCodeSVG 
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/events?code=${eventData.invite_code}`}
                    size={140}
                  />
                </div>
              </div>
            )}

          </div>
        </aside>

      </section>

      {/* QR print poster Modal overlay */}
      {isQRModalOpen && eventData && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl space-y-6">
            <button 
              onClick={() => setIsQRModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-surface-container rounded-full"
            >
              <X className="w-5 h-5 text-secondary" />
            </button>
            
            <div className="space-y-1">
              <h3 className="font-display-lg text-2xl font-bold tracking-tight text-on-surface">Scan to Join</h3>
              <p className="text-secondary text-sm">Veridian Equinox Gala</p>
            </div>

            <div className="p-6 bg-surface-container-low rounded-2xl inline-block border border-outline-variant/10">
              <QRCodeSVG 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/events?code=${eventData.invite_code}`}
                size={200}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-secondary leading-relaxed">
                Aim your device camera at the code to connect, register your face, and instantly pull your memories.
              </p>
              <p className="text-xs font-mono font-bold text-primary">
                CODE: {eventData.invite_code}
              </p>
            </div>

            <Button 
              onClick={() => window.print()}
              className="w-full rounded-full bg-primary hover:bg-primary-container text-white font-bold h-11"
            >
              Print Poster
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
