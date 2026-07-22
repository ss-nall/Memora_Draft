"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Bell, UserCircle, LogOut, Search } from "lucide-react";
import api from "@/lib/api";

interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data);
    } catch (e) {
      console.warn("Failed to fetch notifications");
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
      // Mark all in local state as read
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-glass-fill backdrop-blur-xl border-b border-outline-variant/20 shadow-sm h-20 transition-all duration-300 ease-out-expo">
      <nav className="flex justify-between items-center h-full px-6 md:px-16 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-display-lg text-title-md tracking-tighter text-on-surface hover:opacity-80 transition-opacity">
            Memora
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="font-body-md text-secondary hover:text-on-surface transition-all duration-300 ease-out-expo">
              Experience
            </Link>
            <Link href="/events" className="font-body-md text-secondary hover:text-on-surface transition-all duration-300 ease-out-expo">
              Find Memories
            </Link>
            {user && (
              <Link href="/dashboard" className="font-body-md text-secondary hover:text-on-surface transition-all duration-300 ease-out-expo">
                Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4 relative">
              {/* Notifications bell */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="relative p-2.5 hover:bg-surface-container-high rounded-full transition-all duration-200"
                >
                  <Bell className="w-5 h-5 text-secondary hover:text-on-surface" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full border border-surface-pure animate-pulse"></span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-surface-pure border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden z-50 glass-panel">
                    <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
                      <span className="font-title-md text-sm font-bold text-on-surface">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-secondary text-sm font-body-md">
                          No updates at the moment
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer ${!notif.is_read ? 'bg-primary-fixed/20' : ''}`}
                            onClick={() => {
                              markAsRead(notif.id);
                              setShowDropdown(false);
                            }}
                          >
                            <p className={`text-sm leading-relaxed ${!notif.is_read ? 'text-on-surface font-semibold' : 'text-secondary'}`}>
                              {notif.message}
                            </p>
                            <span className="text-[10px] uppercase font-label-caps text-secondary/70 mt-1 block">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-outline-variant/15 bg-surface-container-low/30">
                      <Link 
                        href="/notifications" 
                        onClick={() => setShowDropdown(false)}
                        className="text-xs text-secondary hover:text-on-surface font-semibold transition-colors"
                      >
                        View all activity
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity */}
              <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full border border-outline-variant/20 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs">
                    {user.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <span className="text-sm font-semibold text-on-surface hidden lg:inline-block max-w-[120px] truncate">
                  {user.full_name}
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-secondary hover:text-primary hover:bg-primary-fixed/20 rounded-lg transition-colors ml-2"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="font-body-md text-secondary hover:text-on-surface transition-all duration-300">
                Log In
              </Link>
              <Link href="/events" className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ease-out-expo hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-primary/10">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
