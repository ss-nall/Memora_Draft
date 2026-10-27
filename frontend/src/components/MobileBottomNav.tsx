"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scan, Images, Film, LayoutDashboard, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Find",
      href: "/events",
      icon: Scan,
      isActive: pathname.startsWith("/events") && !pathname.includes("tab=reels"),
      highlight: true,
    },
    {
      label: "Gallery",
      href: "/dashboard/94c3ce3a-9672-4d38-a116-0c393b503ae3/gallery",
      icon: Images,
      isActive: pathname.includes("/gallery"),
    },
    {
      label: "Reels",
      href: "/events?tab=reels",
      icon: Film,
      isActive: pathname.includes("tab=reels"),
    },
    {
      label: "Host",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard" || (pathname.startsWith("/dashboard") && !pathname.includes("/gallery")),
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F5F4F0]/95 backdrop-blur-xl border-t border-stone-300/60 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          if (item.highlight) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative -top-3 flex flex-col items-center group cursor-pointer"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C25E2E] to-[#E07A4B] text-white flex items-center justify-center shadow-lg shadow-[#C25E2E]/30 ring-4 ring-[#F5F4F0]"
                >
                  <Icon className="w-6 h-6 animate-pulse" />
                </motion.div>
                <span className="text-[10px] font-semibold text-[#C25E2E] mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center py-1 px-2.5 relative group cursor-pointer transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    active ? "text-[#C25E2E]" : "text-stone-500"
                  }`}
                />
                {active && (
                  <motion.span
                    layoutId="activeDot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C25E2E]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 ${
                  active ? "text-[#C25E2E] font-semibold" : "text-stone-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
