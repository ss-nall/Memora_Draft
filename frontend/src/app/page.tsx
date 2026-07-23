"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Sparkles, Image as ImageIcon, Play, Check, Navigation, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function HomePage() {
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Start similarity match score counter on mount / loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDemoRunning) {
      setMatchPercentage(0);
      let current = 0;
      interval = setInterval(() => {
        current += 1.5;
        if (current >= 98.4) {
          setMatchPercentage(98.4);
          clearInterval(interval);
          setIsDemoRunning(false);
        } else {
          setMatchPercentage(Number(current.toFixed(1)));
        }
      }, 30);
    } else {
      // Auto run first time
      setIsDemoRunning(true);
    }
    return () => clearInterval(interval);
  }, [isDemoRunning]);

  return (
    <div className="bg-surface text-on-surface font-body-md overflow-x-hidden pt-20">
      
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Main Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            className="w-full h-full object-cover scale-105 transition-transform duration-1000 ease-out-expo" 
            alt="Family laughing in modern living room"
            src="https://images.unsplash.com/photo-1609234656388-0ff363383899?q=80&w=2560&auto=format&fit=crop"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 text-center max-w-3xl mx-6 px-6 py-12 md:px-12 md:py-16 glass-panel border border-white/60 shadow-2xl backdrop-blur-md rounded-[40px] bg-white/75">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display-xl text-4xl sm:text-5xl md:text-6xl text-on-surface leading-tight mb-8"
          >
            Every detail, <br/> <span className="text-primary italic font-semibold">exactly</span> as you felt it.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-body-lg text-lg text-secondary mb-12 max-w-xl mx-auto leading-relaxed"
          >
            Memora uses cinematic AI to upscale, restore, and organize your lifetime of memories into a living, breathing gallery.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/events">
              <button className="bg-on-surface text-surface-pure px-10 py-5 rounded-full font-semibold text-lg transition-transform duration-300 ease-out-expo hover:scale-105 shadow-lg">
                Find Your Memories
              </button>
            </Link>
            <Link href="/login">
              <button className="flex items-center gap-3 text-on-surface font-semibold hover:gap-5 transition-all duration-300">
                <Play className="w-6 h-6 text-primary fill-primary" />
                Photographer Access
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Floating Parallax Thumbnails (Desktop Only) */}
        <div className="absolute top-1/4 left-8 w-48 h-64 rounded-2xl shadow-xl floating-parallax hidden xl:block" style={{ animationDelay: "0s" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            className="w-full h-full object-cover rounded-2xl border-4 border-white/30" 
            alt="Elderly woman portrait"
            src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=600&auto=format&fit=crop"
          />
        </div>
        <div className="absolute bottom-1/4 right-8 w-56 h-40 rounded-2xl shadow-xl floating-parallax hidden xl:block" style={{ animationDelay: "-2s" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            className="w-full h-full object-cover rounded-2xl border-4 border-white/30" 
            alt="Child steps on beach"
            src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop"
          />
        </div>
      </section>

      {/* Social Proof Strip */}
      <ScrollReveal direction="none">
        <section className="py-8 bg-surface-container-low border-y border-outline-variant/15">
          <div className="max-w-[1440px] mx-auto px-6 md:px-16 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              <span className="font-display-lg text-2xl font-bold whitespace-nowrap">VOGUE</span>
              <span className="font-display-lg text-2xl font-bold whitespace-nowrap">The New York Times</span>
              <span className="font-display-lg text-2xl font-bold whitespace-nowrap">WIRED</span>
              <span className="font-display-lg text-2xl font-bold whitespace-nowrap">TechCrunch</span>
              <span className="font-display-lg text-2xl font-bold whitespace-nowrap">National Geographic</span>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Storytelling Section 1 */}
      <ScrollReveal>
        <section className="py-24 max-w-[1440px] mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 space-y-6">
            <span className="font-label-caps text-xs text-primary tracking-[0.2em] block uppercase">Restoration</span>
            <h2 className="font-display-lg text-4xl sm:text-5xl text-on-surface font-semibold tracking-tight">
              Bring the past into the present.
            </h2>
            <p className="font-body-lg text-lg text-secondary leading-relaxed">
              Old photographs are more than just paper; they are windows into our heritage. Our proprietary NeuralMatch™ technology repairs fading, corrects light, and enhances resolution up to 8K, ensuring your family's history remains as vivid as your future.
            </p>
            <ul className="space-y-6 pt-4">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface text-base">Automatic Color Grading</h4>
                  <p className="text-secondary text-sm">AI-driven color correction that respects the original film stock aesthetics.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface text-base">Ultra-HD Upscaling</h4>
                  <p className="text-secondary text-sm">Transform low-res digital scans into crisp, printable masterpieces.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="order-1 lg:order-2 group">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transition-transform duration-700 ease-out-expo group-hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                className="w-full aspect-[4/5] object-cover" 
                alt="Split screen restoration comparison"
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* AI Face-Matching Demo */}
      <ScrollReveal>
        <section className="bg-surface-subtle py-24 border-y border-outline-variant/10">
          <div className="max-w-[1440px] mx-auto px-6 md:px-16 text-center mb-16 space-y-4">
            <span className="font-label-caps text-xs text-primary tracking-[0.2em] block uppercase">Discovery</span>
            <h2 className="font-display-lg text-4xl sm:text-5xl text-on-surface font-semibold tracking-tight">
              Reconnect across generations.
            </h2>
          </div>
          <div className="max-w-4xl mx-auto px-6 md:px-16">
            <div className="relative bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-outline-variant/10 flex flex-col md:flex-row gap-8 items-center justify-between">
              {/* Person A */}
              <div className="flex-1 text-center">
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary-container mb-6 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Arthur Vance vintage portrait"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop"
                  />
                </div>
                <p className="font-semibold text-on-surface">Arthur Vance, 1944</p>
                <p className="text-secondary text-sm">Great Grandfather</p>
              </div>

              {/* Match Indicator */}
              <div className="flex flex-col items-center gap-3">
                <div className="h-px w-24 md:w-32 bg-outline-variant/30 hidden md:block"></div>
                <span className="material-symbols-outlined text-primary text-4xl animate-pulse">neurology</span>
              </div>

              {/* Person B */}
              <div className="flex-1 text-center">
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-surface-container-high mb-6 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Liam Vance modern portrait"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop"
                  />
                </div>
                <p className="font-semibold text-on-surface">Liam Vance, 2024</p>
                <p className="text-secondary text-sm">Liam Vance</p>
              </div>
            </div>
            <p className="text-center mt-12 text-secondary max-w-2xl mx-auto leading-relaxed">
              Memora's AI identifies family resemblances across decades, grouping your ancestors with their modern-day descendants automatically.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Process Timeline */}
      <ScrollReveal>
        <section className="py-24 max-w-[1440px] mx-auto px-6 md:px-16">
          <div className="text-center mb-24 space-y-4">
            <h2 className="font-display-lg text-4xl sm:text-5xl text-on-surface font-semibold tracking-tight">The path to forever.</h2>
            <p className="text-secondary">Three simple steps to secure your legacy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="absolute top-1/4 left-0 w-full h-px bg-outline-variant/20 hidden md:block z-0"></div>
            
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border border-outline-variant/10 flex items-center justify-center transform hover:rotate-3 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
              </div>
              <h3 className="font-title-md text-xl font-bold">1. Ingest</h3>
              <p className="text-secondary max-w-xs text-sm leading-relaxed">Upload raw files, cloud links, or high-res scans. We handle all formats.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-primary text-on-primary rounded-2xl shadow-lg flex items-center justify-center transform hover:-rotate-3 transition-transform">
                <span className="material-symbols-outlined text-white text-3xl">magic_button</span>
              </div>
              <h3 className="font-title-md text-xl font-bold">2. Enhance</h3>
              <p className="text-secondary max-w-xs text-sm leading-relaxed">Our cinematic AI engine repairs, upscales, and tags every face and location.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border border-outline-variant/10 flex items-center justify-center transform hover:rotate-3 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">auto_awesome_motion</span>
              </div>
              <h3 className="font-title-md text-xl font-bold">3. Experience</h3>
              <p className="text-secondary max-w-xs text-sm leading-relaxed">Access your curated life story on any device, or order custom cinematic prints.</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Pricing Cards */}
      <ScrollReveal>
        <section className="py-24 bg-surface-container-low border-t border-outline-variant/10">
          <div className="max-w-[1440px] mx-auto px-6 md:px-16">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-display-lg text-4xl sm:text-5xl text-on-surface font-semibold tracking-tight">A plan for every legacy.</h2>
              <p className="text-secondary">Simple, transparent pricing. No hidden fees.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              
              {/* Basic */}
              <div className="bg-surface-pure p-10 rounded-[24px] border border-outline-variant/10 flex flex-col hover:shadow-2xl transition-all duration-500 ease-out-expo group justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Curator</h3>
                  <p className="text-secondary mb-8 text-sm">For personal collections.</p>
                  <div className="mb-10">
                    <span className="text-4xl font-extrabold">$12</span>
                    <span className="text-secondary text-sm">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-12">
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> 500 Memory Limit</li>
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> AI Face Recognition</li>
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> 4K Restoration</li>
                  </ul>
                </div>
                <Link href="/events" className="w-full">
                  <button className="w-full py-4 border border-outline rounded-full font-semibold hover:bg-on-surface hover:text-white hover:border-on-surface transition-colors duration-300">
                    Select Plan
                  </button>
                </Link>
              </div>

              {/* Pro (Featured) */}
              <div className="bg-on-surface p-10 rounded-[24px] shadow-2xl flex flex-col transform md:-translate-y-4 relative group justify-between text-white border border-on-surface">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 mt-2">Historian</h3>
                  <p className="text-white/60 mb-8 text-sm">For families and large archives.</p>
                  <div className="mb-10">
                    <span className="text-4xl font-extrabold">$29</span>
                    <span className="text-white/60 text-sm">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-12">
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> Unlimited Memories</li>
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> 8K Restoration Engine</li>
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> Collaborative Albums</li>
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> Cinematic Video Motion</li>
                  </ul>
                </div>
                <Link href="/events" className="w-full">
                  <button className="w-full py-4 bg-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity">
                    Get Started
                  </button>
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-surface-pure p-10 rounded-[24px] border border-outline-variant/10 flex flex-col hover:shadow-2xl transition-all duration-500 ease-out-expo group justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Archivist</h3>
                  <p className="text-secondary mb-8 text-sm">For institutions and estates.</p>
                  <div className="mb-10">
                    <span className="text-4xl font-extrabold">$99</span>
                    <span className="text-secondary text-sm">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-12">
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> White-glove scanning service</li>
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> Priority AI Processing</li>
                    <li className="flex items-center gap-3 text-sm"><Check className="text-primary w-4 h-4 shrink-0" /> Custom API Access</li>
                  </ul>
                </div>
                <button className="w-full py-4 border border-outline rounded-full font-semibold hover:bg-on-surface hover:text-white hover:border-on-surface transition-colors duration-300">
                  Contact Sales
                </button>
              </div>

            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Closing CTA */}
      <ScrollReveal>
        <section className="relative h-[600px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              className="w-full h-full object-cover" 
              alt="Elderly couple walk towards sunset"
              src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=2560&auto=format&fit=crop"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          <div className="relative z-10 text-center max-w-3xl px-6 text-white space-y-8">
            <h2 className="font-display-xl text-4xl sm:text-5xl md:text-6xl font-semibold">Don't let them fade.</h2>
            <p className="font-body-lg text-lg opacity-90 max-w-lg mx-auto">
              Preserve your family's story with the world's most advanced cinematic AI. Start your 14-day free trial today.
            </p>
            <Link href="/events" className="inline-block pt-4">
              <button className="bg-white text-on-surface px-12 py-5 rounded-full font-bold text-lg transition-transform duration-500 hover:scale-110 hover:shadow-2xl">
                Create My Gallery
              </button>
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* Footer */}
      <footer className="bg-surface-subtle border-t border-outline-variant/10 w-full py-16">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col items-center gap-6">
          <Link href="/" className="font-display-lg text-2xl font-bold tracking-tighter text-on-surface">
            Memora
          </Link>
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <a className="text-secondary hover:text-on-surface transition-opacity duration-300 font-medium" href="#">Privacy Policy</a>
            <a className="text-secondary hover:text-on-surface transition-opacity duration-300 font-medium" href="#">Terms of Service</a>
            <a className="text-secondary hover:text-on-surface transition-opacity duration-300 font-medium" href="#">Cookie Settings</a>
            <a className="text-secondary hover:text-on-surface transition-opacity duration-300 font-medium" href="#">Press Kit</a>
          </div>
          <p className="text-secondary font-body-md text-xs text-center mt-6">© 2024 Memora Cinematic. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
