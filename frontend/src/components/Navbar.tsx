"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bell, UserCircle, LogOut } from "lucide-react";
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
  const [showDropdown, setShowDropdown] = useState<string | false>(false);

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

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const pathname = usePathname();

  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-surface-border)] bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Memora
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/events" className="hover:text-purple-400 transition-colors">Events</Link>
          <Link href="/dashboard" className="hover:text-purple-400 transition-colors">Dashboard</Link>
          
          {user ? (
            <div className="flex items-center gap-4 relative">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(showDropdown === 'notifications' ? false : 'notifications')}
                  className="relative p-2 hover:bg-[var(--color-surface)] rounded-full transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--background)]"></span>
                  )}
                </button>

                {showDropdown === 'notifications' && (
                  <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-[var(--color-surface-border)]">
                      <h3 className="font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">No new notifications</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`p-4 border-b border-[var(--color-surface-border)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer ${!notif.is_read ? 'bg-[var(--color-surface-hover)]' : ''}`}
                            onClick={() => markAsRead(notif.id)}
                          >
                            <p className={`text-sm ${!notif.is_read ? 'text-white' : 'text-gray-300'}`}>{notif.message}</p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative border-l border-[var(--color-surface-border)] pl-4">
                <button 
                  onClick={() => setShowDropdown(showDropdown === 'user' ? false : 'user')}
                  className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-[var(--color-surface)] transition-colors"
                >
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="w-8 h-8 rounded-full border border-[var(--color-surface-border)]" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="text-gray-200 hidden md:block text-sm font-medium">{user.full_name}</span>
                </button>

                {showDropdown === 'user' && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#09090b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="font-medium text-white truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link 
                        href="/settings" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 mr-3" />
                        Account Settings
                      </Link>
                    </div>
                    <div className="p-2 border-t border-white/5">
                      <button 
                        onClick={logout}
                        className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/login" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors shadow-lg shadow-purple-500/20">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
