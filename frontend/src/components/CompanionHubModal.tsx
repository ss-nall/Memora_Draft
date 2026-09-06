"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Users, UserPlus, Check, Clock, ShieldCheck, 
  Search, Loader2, Sparkles, UserCheck, HeartHandshake
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import api, { formatApiError } from "@/lib/api";

interface Attendee {
  id: string;
  full_name: string;
  email: string;
  profile_picture?: string;
  has_face_enrolled: boolean;
  connection_status: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "CONNECTED" | "REJECTED";
  request_id?: string;
}

interface CompanionHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName?: string;
  onCompanionUpdated?: () => void;
}

export function CompanionHubModal({
  isOpen,
  onClose,
  eventId,
  eventName = "Event",
  onCompanionUpdated,
}: CompanionHubModalProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchAttendees = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/companions/event/${eventId}/attendees`);
      setAttendees(res.data);
    } catch (err) {
      console.error("Failed to fetch event attendees", err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) {
      fetchAttendees();
    }
  }, [isOpen, fetchAttendees]);

  const handleSendRequest = async (receiverId: string) => {
    setActionLoadingId(receiverId);
    setSuccessMessage("");
    try {
      await api.post(`/companions/event/${eventId}/request`, { receiver_id: receiverId });
      setSuccessMessage("Companion request sent! They will be notified to accept.");
      await fetchAttendees();
      onCompanionUpdated?.();
    } catch (err: any) {
      alert(formatApiError(err, "Failed to send companion request"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRespondRequest = async (requestId: string, action: "ACCEPT" | "REJECT") => {
    setActionLoadingId(requestId);
    setSuccessMessage("");
    try {
      await api.put(`/companions/request/${requestId}/respond`, { action });
      setSuccessMessage(action === "ACCEPT" ? "Connected! Joint photos unlocked." : "Request declined.");
      await fetchAttendees();
      onCompanionUpdated?.();
    } catch (err: any) {
      alert(formatApiError(err, "Failed to respond to request"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAttendees = attendees.filter((a) =>
    a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedCount = attendees.filter((a) => a.connection_status === "CONNECTED").length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white border border-stone-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-900 max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E]">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Family & Friends Circle
                </h3>
                <p className="text-xs text-stone-500">
                  {connectedCount} connected companion{connectedCount !== 1 ? "s" : ""} in {eventName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Explanation Banner */}
          <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-200/50 flex items-start gap-2.5 text-xs text-stone-700">
            <ShieldCheck className="w-4 h-4 text-[#C25E2E] shrink-0 mt-0.5" />
            <span>
              <strong>Mutual Consent Privacy</strong>: Adding a friend or family member sends them an invite. Once accepted, you can both discover photos and video clips where you appear together!
            </span>
          </div>

          {/* Search Bar */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search attendees by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div className="mx-6 my-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Attendees List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#C25E2E]" />
                <span className="text-xs">Loading event guests...</span>
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-xs space-y-1">
                <Users className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="font-semibold">No other attendees found</p>
                <p className="text-stone-400">Guests who join via the event invite QR will appear here.</p>
              </div>
            ) : (
              filteredAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="p-3.5 rounded-2xl border border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-stone-200 overflow-hidden flex items-center justify-center font-bold text-stone-600 shrink-0 border border-stone-300">
                      {attendee.profile_picture ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={attendee.profile_picture} alt={attendee.full_name} className="w-full h-full object-cover" />
                      ) : (
                        attendee.full_name?.charAt(0).toUpperCase() || "G"
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-stone-900 truncate">
                          {attendee.full_name || "Event Guest"}
                        </h4>
                        {attendee.has_face_enrolled && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
                            Face ID Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">{attendee.email}</p>
                    </div>
                  </div>

                  {/* Actions according to connection_status */}
                  <div>
                    {attendee.connection_status === "CONNECTED" && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </div>
                    )}

                    {attendee.connection_status === "PENDING_SENT" && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Invite Sent</span>
                      </div>
                    )}

                    {attendee.connection_status === "PENDING_RECEIVED" && attendee.request_id && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={actionLoadingId === attendee.request_id}
                          onClick={() => handleRespondRequest(attendee.request_id!, "ACCEPT")}
                          className="px-3 py-1.5 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === attendee.request_id}
                          onClick={() => handleRespondRequest(attendee.request_id!, "REJECT")}
                          className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {(attendee.connection_status === "NONE" || attendee.connection_status === "REJECTED") && (
                      <Button
                        size="sm"
                        isLoading={actionLoadingId === attendee.id}
                        onClick={() => handleSendRequest(attendee.id)}
                        className="btn-accent text-xs font-semibold h-8 px-3.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Add Friend
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex justify-end">
            <Button size="sm" onClick={onClose} className="btn-accent text-xs font-semibold px-5">
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
