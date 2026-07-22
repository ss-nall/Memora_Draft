import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, Play, Pause, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ReelSettings } from "./TemplateEditor";

export type ReelTemplate = 'minimal' | 'vintage' | 'party' | 'custom';

interface MatchedPhoto {
  id: string;
  storage_url: string;
  media_type?: string;
  timestamps?: number[];
}

interface Slide {
  id: string;
  url: string;
  type: "PHOTO" | "VIDEO";
  timestamp?: number;
}

interface MemoryReelProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MatchedPhoto[];
  baseUrl: string;
  settings: ReelSettings;
}

export function MemoryReel({ isOpen, onClose, memories, baseUrl, settings }: MemoryReelProps) {
  const SLIDE_DURATION = settings.speed === 'slow' ? 6000 : settings.speed === 'fast' ? 2000 : 4000;
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    // Flatten memories into individual slides (1 per photo, or 1 per timestamp for videos)
    const newSlides: Slide[] = [];
    memories.forEach((mem) => {
      const url = `${baseUrl}/${mem.storage_url.replace(/\\/g, '/')}`;
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
  }, [isOpen, memories, baseUrl]);

  useEffect(() => {
    if (!isOpen || slides.length === 0) return;

    let animationFrameId: number;

    const startProgress = () => {
      startTimeRef.current = performance.now() - (progress * SLIDE_DURATION) / 100;
      
      const updateProgress = (currentTime: number) => {
        if (!isPlaying) return;
        
        const elapsed = currentTime - startTimeRef.current;
        const newProgress = (elapsed / SLIDE_DURATION) * 100;

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
  }, [currentIndex, isPlaying, slides, isOpen]);

  // Handle Play/Pause button toggling for the current video
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
      onClose(); // Auto close at end
    }
  };

  const handlePrev = () => {
    setProgress(0);
    pausedTimeRef.current = 0;
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!isOpen || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  // Template Configurations
  const getContainerClass = () => {
    switch (settings.background) {
      case 'gradient': return "fixed inset-0 z-[100] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 flex flex-col items-center justify-center overflow-hidden";
      case 'blur': return "fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center overflow-hidden";
      case 'solid':
      default:
        if (settings.template === 'vintage') return "fixed inset-0 z-[100] bg-[#1a1514] flex flex-col items-center justify-center";
        return "fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center";
    }
  };

  const getMediaClass = () => {
    if (settings.template === 'vintage') return "w-full h-full object-contain sepia-[.35] contrast-[1.1] brightness-90 drop-shadow-2xl";
    if (settings.template === 'party') return "w-full h-full object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]";
    return "w-full h-full object-contain drop-shadow-2xl";
  };

  const getMotionVariants = (): Variants => {
    if (settings.template === 'vintage') {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, scale: [1.02, 1.05], transition: { opacity: { duration: 0.8 }, scale: { duration: SLIDE_DURATION / 1000, ease: "linear" } } },
        exit: { opacity: 0, transition: { duration: 0.8 } }
      };
    }
    if (settings.template === 'party') {
      return {
        initial: { opacity: 0, scale: 0.5, rotate: -5 },
        animate: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
        exit: { opacity: 0, scale: 1.5, rotate: 5, transition: { duration: 0.3 } }
      };
    }

    switch (settings.transition) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 100 },
          animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
          exit: { opacity: 0, x: -100, transition: { duration: 0.4, ease: "easeIn" } }
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 1.2 },
          animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
          exit: { opacity: 0, scale: 0.8, transition: { duration: 0.5, ease: "easeIn" } }
        };
      case 'flip':
        return {
          initial: { opacity: 0, rotateY: -90 },
          animate: { opacity: 1, rotateY: 0, transition: { duration: 0.6, ease: "easeOut" } },
          exit: { opacity: 0, rotateY: 90, transition: { duration: 0.6, ease: "easeIn" } }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
          exit: { opacity: 0, scale: 1.05, transition: { duration: 0.5, ease: "easeOut" } }
        };
    }
  };

  return (
    <div className={getContainerClass()}>
      {/* Background Blur Effect */}
      {settings.background === 'blur' && currentSlide.type === "PHOTO" && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl transform scale-110" 
          style={{ backgroundImage: `url(${currentSlide.url})` }}
        />
      )}

      {/* Party Template Background Effects */}
      {settings.template === 'party' && (
        <>
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </>
      )}

      {/* Vintage Template Overlay */}
      {settings.template === 'vintage' && (
        <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dust.png')] opacity-30 z-50 mix-blend-overlay" />
      )}

      {/* Progress Bars (Story Style) */}
      <div className="absolute top-4 left-4 right-16 flex gap-2 z-10 max-w-3xl mx-auto w-full px-4">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute top-16 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
      >
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </button>

      {/* Slide Content */}
      <div className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            variants={getMotionVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`absolute inset-0 flex items-center justify-center ${settings.template === 'vintage' ? 'p-8 pb-20 bg-white/5 backdrop-blur-sm shadow-2xl rounded-sm' : ''}`}
          >
            {currentSlide.type === "VIDEO" ? (
              <video
                ref={videoRef}
                src={currentSlide.url}
                className={getMediaClass()}
                muted
                playsInline
                onLoadedMetadata={(e) => {
                  e.currentTarget.currentTime = currentSlide.timestamp || 0;
                  if (isPlaying) {
                    e.currentTarget.play().catch(() => {}); // catch AbortErrors silently
                  }
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSlide.url}
                alt="Memory"
                className={getMediaClass()}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Invisible Click Areas for Next/Prev */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer flex items-center justify-start px-4 opacity-0 hover:opacity-100 transition-opacity"
          onClick={handlePrev}
        >
          <div className="p-3 bg-black/40 rounded-full backdrop-blur-md">
            <ChevronLeft className="w-8 h-8 text-white" />
          </div>
        </div>
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer flex items-center justify-end px-4 opacity-0 hover:opacity-100 transition-opacity"
          onClick={handleNext}
        >
          <div className="p-3 bg-black/40 rounded-full backdrop-blur-md">
            <ChevronRight className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
