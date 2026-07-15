"use client";

import { motion } from "framer-motion";
import { Camera, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl space-y-8"
      >
        <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-300">
          <Sparkles className="mr-2 h-4 w-4" />
          Powered by InsightFace AI Engine
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Capture Memories. <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            Find Yourself.
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          The next-generation event photography platform. AI instantly scans massive photo dumps and automatically sends guests only the photos they are in.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              Get Started (Photographer)
            </Button>
          </Link>
          <Link href="/events" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              Join Event (Guest)
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24">
        {[
          { title: "Lightning Fast Uploads", icon: <Camera className="h-8 w-8 text-purple-400" />, desc: "Upload thousands of RAW photos in seconds directly from your camera." },
          { title: "AI Face Recognition", icon: <Sparkles className="h-8 w-8 text-pink-400" />, desc: "Our 512-dimensional vector engine finds your guests instantly with 99.8% accuracy." },
          { title: "Beautiful Galleries", icon: <ImageIcon className="h-8 w-8 text-blue-400" />, desc: "Stunning, responsive galleries that look perfect on any device." },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
          >
            <Card hoverEffect className="h-full flex flex-col items-center text-center p-6 space-y-4">
              <div className="p-3 bg-white/5 rounded-2xl">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
