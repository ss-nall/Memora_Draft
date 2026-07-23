"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Bell, Sparkles, Check, Settings, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data);
    } catch (e) {
      console.warn("Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.is_read)
          .map(n => api.put(`/notifications/${n.id}/read`))
      );
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pt-32 pb-24 font-body-md selection:bg-primary-fixed">
      
      {/* Outer wrapper */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-16">
        
        {/* Navigation Breadcrumb */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-secondary hover:text-on-surface mb-6 group transition-colors text-sm font-semibold">
          <ArrowLeft className="w-4 h-4 text-primary transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 scroll-reveal active">
          <div>
            <span className="text-primary font-label-caps tracking-[0.2em] uppercase text-xs mb-1.5 block">Activity Feed</span>
            <h1 className="font-display-lg text-4xl sm:text-5xl font-bold tracking-tight">Notifications</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={markAllAsRead}
              className="px-6 py-2.5 rounded-full border border-outline-variant text-secondary font-semibold text-sm hover:bg-surface-container-low transition-colors active:scale-95"
            >
              Mark all as read
            </button>
            <button className="px-6 py-2.5 rounded-full bg-surface-container-highest text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors active:scale-95">
              Settings
            </button>
          </div>
        </header>

        {/* Notifications Timeline List */}
        {isLoading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          
          /* Empty Notifications Feed - Render beautiful placeholder */
          <div className="text-center py-20 border border-dashed border-outline-variant/20 rounded-3xl bg-surface-pure space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Inbox is empty</h3>
            <p className="text-secondary max-w-sm mx-auto text-sm">
              We'll notify you as soon as new event photos are uploaded or AI finishes processing.
            </p>
          </div>
        ) : (
          
          /* Notifications feed with Luminous Narrative styling */
          <section className="space-y-16 relative">
            {notifications.map((notif, index) => {
              const isLast = index === notifications.length - 1;
              return (
                <div 
                  key={notif.id}
                  className={`relative flex gap-6 items-start scroll-reveal active ${!isLast ? 'notification-line' : 'notification-line-last'}`}
                >
                  {/* Indicator Icon */}
                  <div 
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${!notif.is_read ? 'bg-primary text-white soft-glow-unread scale-105' : 'bg-surface-container text-secondary'}`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>

                  {/* Content details */}
                  <div className="flex-grow space-y-3">
                    <div>
                      <span className="text-[10px] font-label-caps text-secondary uppercase tracking-widest block mb-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                      <h2 className={`font-title-md text-xl font-bold tracking-tight text-on-surface ${!notif.is_read ? 'text-primary' : 'text-on-surface'}`}>
                        {notif.message}
                      </h2>
                      <p className="text-secondary text-sm max-w-2xl leading-relaxed mt-2">
                        Memora processed this memory using the 512-dimensional vector engine matching.
                      </p>
                    </div>

                    {/* Tuscan landscape showcase card for the first notification */}
                    {index === 0 && (
                      <div className="mt-4 group relative overflow-hidden rounded-3xl aspect-[16/9] md:aspect-[21/9] border border-white/40 shadow-sm max-w-3xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                          alt="Tuscan vineyard landscape"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDO3VkNVC9ojWGhsVox8kbsHJdtpoWhk8ExKtbZ8w2De3TSG9BKX5YuKLI52TIb6ogctT2MP6Lea1D5IMVmT7jX5fL9rLElh1pEepHF5rQPkBEg0BOxy01Y-5pkwUiZnzEWGySqSrg7CSe9i5uAzzHM2tDpD_m6YJ5VPLKVmEXr33K4jtPjxBP-t40I5RVQCCeBX6mbte37DqlZxEdQG4RFRqlMyWw-bkEprUnIt7enkz1nzqqAvz-j-e8GmKyNn7mMuTnxwDE63zCn"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-white">
                          <div>
                            <p className="font-bold text-sm">The Golden Hour Sessions</p>
                            <p className="text-[10px] uppercase font-label-caps opacity-80">Val d'Orcia, Italy</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

    </div>
  );
}
