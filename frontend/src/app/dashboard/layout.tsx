"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Calendar, 
  Settings,
  Users,
  CreditCard,
  Menu,
  X,
  Plus,
  HelpCircle,
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { CreateEventModal } from "@/components/CreateEventModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'AI Studio', href: '/dashboard/ai', icon: Sparkles },
    { name: 'Collaborators', href: '/dashboard/collaborators', icon: Users },
    { name: 'Financials', href: '/dashboard/financials', icon: CreditCard },
  ];
  
  const bottomNavigation = [
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help Center', href: '#', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-[#FCFAEE] overflow-hidden text-[#1C2321] font-sans">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm border border-gray-200"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 260, x: isSidebarOpen ? 0 : -260 }}
        className="fixed lg:relative z-40 h-full bg-white border-r border-gray-100 flex flex-col transform lg:transform-none lg:translate-x-0 transition-transform duration-300"
      >
        <div className="p-8 pb-4 flex-shrink-0 flex flex-col items-start gap-4">
          <Link href="/" className="font-bold text-xl tracking-tight text-[#14241B]">
            Memora
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D33B31]" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">PREMIUM ORGANIZER</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto mt-4">
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm ${
                  isActive
                    ? "bg-[#14241B] text-white font-medium shadow-md shadow-[#14241B]/10"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#14241B] font-medium"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-8 space-y-2 flex-shrink-0">
          <Button onClick={() => setIsCreateModalOpen(true)} className="w-full bg-[#14241B] text-white hover:bg-[#1E3629] h-12 shadow-md shadow-[#14241B]/10 rounded-xl mb-4 text-sm">
            <Plus className="mr-2 h-4 w-4" /> New Production
          </Button>

          {bottomNavigation.map((item) => (
             <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#14241B] font-medium"
              >
                <item.icon className="w-4 h-4 text-gray-400" />
                {item.name}
              </Link>
          ))}
          
          <button 
             onClick={() => logout()}
             className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm text-gray-600 hover:bg-red-50 hover:text-[#D33B31] font-medium"
          >
             <LogOut className="w-4 h-4 text-gray-400" />
             Sign Out
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full pt-20 lg:pt-12">
          {children}
        </div>
      </div>

      <CreateEventModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
