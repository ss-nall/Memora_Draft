"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Type, AlignLeft, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import api, { formatApiError } from "@/lib/api";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const eventData = {
        title: title.trim(),
        date: new Date(date).toISOString(),
        description: description.trim() || null,
      };

      await api.post("/events/", eventData);
      
      setTitle("");
      setDate("");
      setDescription("");
      
      onSuccess();
    } catch (err: any) {
      setError(formatApiError(err, "Failed to create event. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-white border border-stone-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-900">Create New Event</h3>
                  <p className="text-[11px] text-stone-500">Generates instant invite QR & vector database</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 block">
                  Event Title
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Liam & Maya Wedding Reception"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  icon={<Type className="h-4 w-4" />}
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 block">
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 block">
                  Location / Description (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-stone-400">
                    <AlignLeft className="h-4 w-4" />
                  </div>
                  <textarea
                    placeholder="Venue location, notes, or photographer credits..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex min-h-[90px] w-full rounded-xl border border-stone-300 bg-white/90 pl-10 pr-4 py-2.5 text-xs text-stone-900 transition-colors placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-600"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Button type="submit" size="sm" isLoading={isLoading} className="btn-accent text-xs">
                  Create Event & Generate QR
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
