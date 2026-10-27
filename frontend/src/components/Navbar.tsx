"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bell, UserCircle, LogOut, Scan, Plus, Check } from "lucide-react";
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data);
    } catch {
      // Background notifications silent error
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-900/[0.06] bg-[#F5F4F0]/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#C25E2E] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            M
          </div>
          <span className="font-semibold text-lg tracking-tight text-stone-900">
            Memora
          </span>
        </Link>

        {/* Navigation & Roles */}
        <nav className="flex items-center gap-1 sm:gap-4 text-sm font-medium">
          <Link
            href="/events"
            className={`hidden md:flex px-3 py-1.5 rounded-lg transition-colors items-center gap-1.5 ${
              pathname.startsWith("/events")
                ? "bg-white text-stone-900 shadow-sm border border-stone-200"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
            }`}
          >
            <Scan className="w-3.5 h-3.5 text-[#C25E2E]" />
            <span>Find Photos</span>
          </Link>

          <Link
            href="/dashboard"
            className={`hidden md:flex px-3 py-1.5 rounded-lg transition-colors ${
              pathname.startsWith("/dashboard")
                ? "bg-white text-stone-900 shadow-sm border border-stone-200"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
            }`}
          >
            Organizer Dashboard
          </Link>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-4 border-l-0 md:border-l border-stone-300/80 relative">
              
              {/* Real Notifications Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-white/80 rounded-full transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C25E2E] rounded-full ring-2 ring-[#F5F4F0]"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                      <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-medium text-[#C25E2E] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-stone-400 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3.5 hover:bg-stone-50 transition-colors cursor-pointer flex items-start gap-2.5 ${
                              !notif.is_read ? "bg-amber-50/40" : ""
                            }`}
                            onClick={() => markAsRead(notif.id)}
                          >
                            <div className="w-2 h-2 rounded-full bg-[#C25E2E] mt-1.5 shrink-0 opacity-80" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-stone-800 leading-relaxed font-normal">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-stone-400 mt-1 block">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {!notif.is_read && (
                              <Check className="w-3.5 h-3.5 text-stone-400 hover:text-stone-700 shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-white/80 transition-colors border border-stone-200/80 cursor-pointer"
                >
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-6 h-6 text-stone-500" />
                  )}
                  <span className="text-xs font-medium text-stone-800 hidden md:block max-w-[120px] truncate">
                    {user.full_name || user.email}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {user.full_name || "User"}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      <UserCircle className="w-3.5 h-3.5 mr-2 text-stone-500" />
                      Account & Face ID
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="flex items-center w-full px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-[#C25E2E] hover:bg-[#A34A20] text-white text-xs font-medium rounded-lg shadow-sm transition-all"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

