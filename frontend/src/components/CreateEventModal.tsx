"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Type, AlignLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";

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
      // Backend expects: title (str), date (datetime str), description (optional str)
      const eventData = {
        title,
        date: new Date(date).toISOString(),
        description: description || null,
      };

      await api.post("/events/", eventData);
      
      // Reset form
      setTitle("");
      setDate("");
      setDescription("");
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-lg pointer-events-auto"
            >
              <Card className="border border-white/10 shadow-2xl bg-[#09090b]/95">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                  <CardTitle className="text-xl">Create New Event</CardTitle>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-1.5 block">Event Title</label>
                        <Input
                          type="text"
                          placeholder="e.g. Sarah's Wedding"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          icon={<Type className="h-5 w-5" />}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-1.5 block">Date</label>
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          icon={<Calendar className="h-5 w-5" />}
                          required
                          className="css-calendar-icon-fix"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-1.5 block">Description (Optional)</label>
                        <div className="relative">
                          <div className="absolute left-4 top-3 text-gray-400">
                            <AlignLeft className="h-5 w-5" />
                          </div>
                          <textarea
                            placeholder="Add a short description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="flex min-h-[100px] w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface)] pl-11 pr-4 py-3 text-sm text-[var(--foreground)] transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                      <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={isLoading}>
                        Create Event
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
