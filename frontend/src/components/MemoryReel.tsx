"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  X, Play, Pause, ChevronLeft, ChevronRight, Sparkles, Volume2, 
  VolumeX, Music, Film, Wand2, Info
} from "lucide-react";
import { ReelSettings } from "./TemplateEditor";
import { 
  SOUNDTRACK_CATALOG, SoundtrackTrack, webAudioSynth, autoSelectSong 
} from "@/lib/reelAudio";
import { 
  VIDEO_EFFECT_PRESETS, VideoEffectType, VideoEffectPreset 
} from "@/lib/reelEditor";

export type ReelTemplate = 'minimal' | 'vintage' | 'party' | 'custom';

interface MatchedPhoto {
  id: string;
  storage_url: string;
  media_type?: string;
  timestamps?: number[];
  created_at?: string;
}

interface Slide {
  id: string;
  url: string;
  type: "PHOTO" | "VIDEO" | "INTRO";
  timestamp?: number;
  title?: string;
  subtitle?: string;
}

interface MemoryReelProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MatchedPhoto[];
  baseUrl: string;
  settings: ReelSettings;
}

export function MemoryReel({ isOpen, onClose, memories, baseUrl, settings }: MemoryReelProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Active Soundtrack Resolution
  const activeTrack = useMemo<SoundtrackTrack>(() => {
    if (settings.selectedTrackId) {
      const found = SOUNDTRACK_CATALOG.find((t) => t.id === settings.selectedTrackId);
      if (found) return found;
    }
    return autoSelectSong(settings.eventTitle || "Event", "", memories.length).track;
  }, [settings.selectedTrackId, settings.eventTitle, memories.length]);

  // Active Video Effect Preset Resolution
  const activeEffect = useMemo<VideoEffectPreset>(() => {
    let effectKey = settings.videoEffect || 'auto';
    if (effectKey === 'auto') {
      switch (activeTrack.mood) {
        case 'celebration': effectKey = 'vibrant_pop'; break;
        case 'acoustic': effectKey = 'golden_hour'; break;
        case 'chill': effectKey = 'moody_cinema'; break;
        case 'cinematic': effectKey = 'cinematic'; break;
        case 'retro': effectKey = 'vintage_sepia'; break;
        default: effectKey = 'cinematic';
      }
    }
    return VIDEO_EFFECT_PRESETS[effectKey] || VIDEO_EFFECT_PRESETS.cinematic;
  }, [settings.videoEffect, activeTrack.mood]);

  // Dynamic Beat-Synced Slide Duration
  const currentSlideDuration = useMemo(() => {
    if (slides.length > 0 && slides[currentIndex]?.type === "INTRO") {
      return 3500; // Intro card duration
    }
    const bpm = activeTrack.bpm || 100;
    const baseDuration = (60 / bpm) * 1000 * 4; // 4 beats per slide
    const speed = settings.speed || 'normal';

    if (speed === 'slow') return Math.max(4500, baseDuration * 1.3);
    if (speed === 'fast') return Math.min(2200, baseDuration * 0.7);
    return Math.max(2800, Math.min(4200, baseDuration));
  }, [currentIndex, slides, activeTrack.bpm, settings.speed]);

  // Construct Slide Array
  useEffect(() => {
    if (!isOpen) return;

    const newSlides: Slide[] = [];

    // Optional Intro Title Card
    if (settings.showIntroCard !== false && memories.length > 0) {
      const cleanTitle = (settings.eventTitle || "Memora Memories").replace(/memora/gi, "").trim() || "Event Highlights";
      newSlides.push({
        id: "intro-card",
        url: "",
        type: "INTRO",
        title: cleanTitle,
        subtitle: `${memories.length} Cherished Moments • AI Soundtrack by ${activeTrack.artist}`,
      });
    }

    // Flatten memories into individual slides
    memories.forEach((mem) => {
      let url = mem.storage_url || "";
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:")) {
        url = `${baseUrl}/${url.replace(/\\/g, '/')}`;
      }
      if (mem.media_type === "VIDEO" && mem.timestamps && mem.timestamps.length > 0) {
        mem.timestamps.forEach((ts) => {
          newSlides.push({ id: `${mem.id}-${ts}`, url, type: "VIDEO", timestamp: ts });
        });
      } else {
        newSlides.push({ id: mem.id, url, type: "PHOTO" });
      }
    });

    setSlides(newSlides);
    setCurrentIndex(0);
    setIsPlaying(true);
    setProgress(0);
    pausedTimeRef.current = 0;
  }, [isOpen, memories, baseUrl, settings.showIntroCard, settings.eventTitle, activeTrack]);

  // Background Audio Soundtrack Control
  useEffect(() => {
    if (!isOpen) {
      if (webAudioSynth) webAudioSynth.stop();
      return;
    }

    if (isPlaying && !isMuted) {
      if (webAudioSynth) {
        webAudioSynth.playTrack(activeTrack);
      }
    } else {
      if (webAudioSynth) webAudioSynth.stop();
    }

    return () => {
      if (webAudioSynth) webAudioSynth.stop();
    };
  }, [isOpen, isPlaying, isMuted, activeTrack]);

  // Mute toggle helper
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (webAudioSynth) {
        if (next) webAudioSynth.stop();
        else if (isPlaying) webAudioSynth.playTrack(activeTrack);
      }
      return next;
    });
  };

  // Progress Bar & Auto-Advancing Timer
  useEffect(() => {
    if (!isOpen || slides.length === 0) return;

    let animationFrameId: number;

    const startProgress = () => {
      startTimeRef.current = performance.now() - (progress * currentSlideDuration) / 100;
      
      const updateProgress = (currentTime: number) => {
        if (!isPlaying) return;
        
        const elapsed = currentTime - startTimeRef.current;
        const newProgress = (elapsed / currentSlideDuration) * 100;

        if (newProgress >= 100) {
          handleNext();
        } else {
          setProgress(newProgress);
          animationFrameId = requestAnimationFrame(updateProgress);
        }
      };
      
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    if (isPlaying) {
      startProgress();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [currentIndex, isPlaying, slides, isOpen, currentSlideDuration]);

  // Handle Play/Pause button toggling for video elements
  useEffect(() => {
    if (!videoRef.current || slides.length === 0) return;
    const current = slides[currentIndex];
    if (current?.type !== "VIDEO") return;

    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, currentIndex, slides]);

  const handleNext = () => {
    setProgress(0);
    pausedTimeRef.current = 0;
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose(); // Auto close at end of reel
    }
  };

  const handlePrev = () => {
    setProgress(0);
    pausedTimeRef.current = 0;
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
      if (e.key === "m" || e.key === "M") handleToggleMute();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, currentIndex, slides.length]);

  if (!isOpen || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  // Motion Variants
  const getMotionVariants = (): Variants => {
    switch (settings.transition) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 80 },
          animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut" } },
          exit: { opacity: 0, x: -80, transition: { duration: 0.35, ease: "easeIn" } }
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 1.15 },
          animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
          exit: { opacity: 0, scale: 0.9, transition: { duration: 0.4, ease: "easeIn" } }
        };
      case 'flip':
        return {
          initial: { opacity: 0, rotateY: -70 },
          animate: { opacity: 1, rotateY: 0, transition: { duration: 0.55, ease: "easeOut" } },
          exit: { opacity: 0, rotateY: 70, transition: { duration: 0.4, ease: "easeIn" } }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0, scale: 0.97 },
          animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
          exit: { opacity: 0, scale: 1.03, transition: { duration: 0.4, ease: "easeOut" } }
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center overflow-hidden select-none touch-none">
      
      {/* Background Ambience Layer */}
      {settings.background === 'blur' && currentSlide?.url && currentSlide.type !== "INTRO" && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-35 blur-3xl transform scale-110 transition-all duration-700" 
          style={{ backgroundImage: `url(${currentSlide.url})` }}
        />
      )}

      {settings.background === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-stone-950 to-indigo-950 opacity-90" />
      )}

      {/* Cinematic Film Vignette Overlay */}
      {activeEffect.hasVignette && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
      )}

      {/* Floating Golden Particles for Celebratory / Golden Hour Effects */}
      {activeEffect.hasParticles && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-60">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-pink-400/15 blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }} />
        </div>
      )}

      {/* Retro 90s Vintage Texture Overlay */}
      {activeEffect.id === "vintage_sepia" && (
        <div className="absolute inset-0 pointer-events-none opacity-20 z-20 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      )}

      {/* Top Progress Bars (Story Style) */}
      <div className="absolute top-3 left-4 right-20 flex gap-1.5 z-30 max-w-2xl mx-auto w-full px-2">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-xs">
            <div 
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{ 
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Top Header Controls */}
      <div className="absolute top-7 left-6 right-6 flex items-center justify-between z-30 pointer-events-none">
        {/* Track Badge & Effect Tag */}
        <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white/90 text-[11px]">
          <Music className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          <span className="font-semibold truncate max-w-[130px] sm:max-w-[200px]">{activeTrack.title}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80 font-medium">
            {activeEffect.name}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mute/Unmute */}
          <button
            onClick={handleToggleMute}
            className="p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full border border-white/10 transition-colors cursor-pointer"
            title={isMuted ? "Unmute Music" : "Mute Music"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Play/Pause */}
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full border border-white/10 transition-colors cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          {/* Close */}
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full border border-white/10 transition-colors cursor-pointer"
            title="Close Reel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Reel Viewport */}
      <div className="relative w-full h-full max-w-4xl max-h-[82vh] flex items-center justify-center p-4 z-20">
        <AnimatePresence mode="wait">
          {currentSlide.type === "INTRO" ? (
            /* Intro Title Card Slide */
            <motion.div
              key="intro-slide"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-lg aspect-3/4 sm:aspect-9/16 max-h-[75vh] rounded-3xl bg-gradient-to-br from-stone-900 via-black to-stone-900 border border-white/15 shadow-2xl p-8 flex flex-col items-center justify-center text-center text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C25E2E]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#F59E0B] mb-6 shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold tracking-widest text-[#F59E0B] uppercase mb-2">
                AI Memory Highlight Reel
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-3 max-w-xs">
                {currentSlide.title}
              </h2>
              <p className="text-xs text-stone-300 max-w-xs leading-relaxed mb-6">
                {currentSlide.subtitle}
              </p>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] text-stone-300 border border-white/10">
                <Music className="w-3 h-3 text-[#F59E0B]" />
                <span>Soundtrack: {activeTrack.title}</span>
              </div>
            </motion.div>
          ) : (
            /* Media Slide (Photo or Video) */
            <motion.div
              key={currentSlide.id}
              variants={getMotionVariants()}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full h-full max-h-[78vh] flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl"
            >
              {currentSlide.type === "PHOTO" ? (
                <motion.img
                  src={currentSlide.url}
                  alt="Event Memory"
                  animate={
                    settings.kenBurns !== false
                      ? {
                          scale: [1, 1.12],
                          x: [0, (currentIndex % 2 === 0 ? 10 : -10)],
                          y: [0, (currentIndex % 3 === 0 ? -6 : 6)],
                        }
                      : {}
                  }
                  transition={{
                    duration: currentSlideDuration / 1000,
                    ease: "linear",
                  }}
                  style={{
                    filter: activeEffect.filterCss !== "none" ? activeEffect.filterCss : undefined,
                  }}
                  className="w-full h-full object-contain max-h-[78vh] drop-shadow-2xl rounded-2xl"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentSlide.url}
                  className="w-full h-full object-contain max-h-[78vh] drop-shadow-2xl rounded-2xl"
                  autoPlay
                  playsInline
                  muted={isMuted}
                  style={{
                    filter: activeEffect.filterCss !== "none" ? activeEffect.filterCss : undefined,
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left/Right Navigation Taps */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/40 hover:text-white disabled:opacity-0 rounded-full bg-black/20 hover:bg-black/50 transition-all cursor-pointer z-30"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/40 hover:text-white rounded-full bg-black/20 hover:bg-black/50 transition-all cursor-pointer z-30"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Bottom Status Footer */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] text-white/60 z-30 pointer-events-none">
        <span className="font-mono">
          {currentIndex + 1} / {slides.length}
        </span>
        <div className="flex items-center gap-2">
          <span>Tap edges or use arrow keys</span>
        </div>
      </div>

    </div>
  );
}
