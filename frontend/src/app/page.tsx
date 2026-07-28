"use client";

import { motion } from "framer-motion";
import { Camera, Shield, QrCode, ArrowRight, Share2, ChartBar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pt-12 pb-32 text-center px-4 overflow-hidden relative font-sans text-[#1C2321]">
      
      {/* Top Navbar (Specific to this Landing Page design) */}
      <nav className="absolute top-0 w-full max-w-7xl px-6 py-6 flex items-center justify-between z-50">
        <div className="font-bold text-xl tracking-tight text-[#14241B]">Memora</div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <a href="#" className="hover:text-[#14241B] transition-colors">Features</a>
          <a href="#" className="hover:text-[#14241B] transition-colors">Solutions</a>
          <a href="#" className="hover:text-[#14241B] transition-colors">Gallery</a>
          <a href="#" className="hover:text-[#14241B] transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#14241B]">Login</Link>
          <Link href="/dashboard">
            <button className="bg-[#14241B] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#1E3629] transition-all">
              Book Now
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl space-y-8 relative z-10 mt-24"
      >
        <div className="inline-flex items-center rounded-full bg-[#14241B] px-4 py-1 text-xs font-semibold text-white tracking-widest uppercase shadow-sm">
          The Premier Event AI Platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-[#14241B]">
          Memories captured by AI,<br />
          <span className="text-[#D33B31] italic font-serif tracking-normal">
            delivered in seconds.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed mt-6">
          Elevate your event experience with real-time AI processing, instant delivery, facial recognition, and stunning cinematic results.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 h-12 text-sm bg-[#14241B] text-white hover:bg-[#1E3629] rounded-full font-semibold transition-all hover:scale-105 active:scale-95">
              Book a Demo
            </button>
          </Link>
          <Link href="/events" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 h-12 text-sm rounded-full font-semibold border border-gray-300 text-[#14241B] bg-white hover:bg-gray-50 transition-all">
              Explore Capabilities
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Floating Mockup Component */}
      <motion.div
        className="mt-16 w-full max-w-5xl relative z-10 perspective-[2000px]"
        initial={{ opacity: 0, y: 60 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          rotateX: mousePosition.y * -0.5,
          rotateY: mousePosition.x * 0.5
        }}
        transition={{ 
          opacity: { duration: 1, delay: 0.2 },
          y: { duration: 1, delay: 0.2, type: "spring", bounce: 0.4 },
          rotateX: { type: "spring", stiffness: 50, damping: 20 },
          rotateY: { type: "spring", stiffness: 50, damping: 20 }
        }}
      >
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-[#E8E4DF] p-2">
          {/* Faux Tablet Frame */}
          <div className="bg-[#F5F2ED] rounded-2xl overflow-hidden shadow-inner border border-white relative h-[400px] md:h-[600px]">
             {/* Gradient glow behind mockup content */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-tr from-[#D33B31]/20 to-blue-400/20 blur-[80px]" />
             
             {/* Mock Dashboard Content Inside Tablet */}
             <div className="absolute inset-4 bg-white rounded-xl shadow-sm border border-gray-100 flex p-4">
                {/* Mock Sidebar */}
                <div className="w-1/4 border-r border-gray-100 pr-4 space-y-4">
                  <div className="w-full h-8 bg-gray-100 rounded-md" />
                  <div className="w-3/4 h-6 bg-gray-50 rounded-md" />
                  <div className="w-3/4 h-6 bg-gray-50 rounded-md" />
                  <div className="w-1/2 h-6 bg-gray-50 rounded-md" />
                </div>
                {/* Mock Content */}
                <div className="flex-1 pl-4 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1/3 h-24 bg-[#14241B]/5 rounded-xl border border-[#14241B]/10" />
                    <div className="w-1/3 h-24 bg-[#D33B31]/5 rounded-xl border border-[#D33B31]/10" />
                    <div className="w-1/3 h-24 bg-blue-50 rounded-xl border border-blue-100" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="col-span-2 h-64 bg-gray-50 rounded-xl border border-gray-100" />
                     <div className="col-span-1 h-64 bg-gray-50 rounded-xl border border-gray-100" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Intelligent by Design Section */}
      <div className="mt-32 w-full max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#14241B]">Intelligent by Design</h2>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
            Elevating the standard of event photography through a seamless, AI-driven workflow that prioritizes speed and precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-[340px] relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="space-y-4 z-10 w-2/3">
              <span className="inline-block px-3 py-1 bg-[#D33B31]/10 text-[#D33B31] text-[10px] font-bold tracking-wider rounded-full uppercase">Processing Engine</span>
              <h3 className="text-2xl font-bold text-[#14241B]">Advanced Face Scanning</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Guests instantly receive their personalized photos without manual searching. Our neural engine matches thousands of images per hour with sub-millisecond latency.
              </p>
            </div>
            {/* Mock Image Overlay */}
            <div className="absolute right-[-20%] bottom-[-10%] w-64 h-64 bg-gray-200 rounded-2xl shadow-xl transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500 border-4 border-white overflow-hidden">
               <div className="w-full h-full bg-[#14241B] opacity-10" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center h-[340px] relative overflow-hidden text-center group hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#14241B] mb-2">Bespoke Galleries</h3>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Personalized white-label links delivered via SMS the moment the shutter clicks.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-[280px] group hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#14241B] mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#14241B] mb-2">Sovereign Privacy</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Enterprise-grade security with SOC2 compliance. Guests remain in total control over their digital footprints with one-click data deletion.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-row items-center justify-between h-[280px] group hover:shadow-md transition-shadow">
            <div className="w-1/2 pr-4 space-y-2">
              <h3 className="text-xl font-bold text-[#14241B]">Precision Analytics</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Granular tracking of engagement, downloads, and social shares. Monitor the pulse of your event.
              </p>
            </div>
            <div className="w-1/2 flex items-center justify-center">
              <div className="w-full max-w-[150px] space-y-3">
                <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
                  <div className="h-full bg-[#14241B] w-3/4 rounded-full" />
                </div>
                <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
                  <div className="h-full bg-[#D33B31] w-1/2 rounded-full" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
