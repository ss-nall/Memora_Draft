"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sparkles, Download, RotateCw, RotateCcw, FlipHorizontal, 
  Sliders, Wand2, RefreshCw, Eye, Check, Layers, Crop, Sun, Contrast, 
  Palette, Flame, ShieldAlert, Image as ImageIcon, Loader2, Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { analyzeImage, ImageAnalysisResult } from "@/lib/imageAnalysis";
import api from "@/lib/api";

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  cssFilter: string;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
    exposure: number;
    shadows: number;
    highlights: number;
    clarity: number;
    vignette: number;
  };
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "original",
    name: "Original",
    description: "No filter applied",
    cssFilter: "none",
    adjustments: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, exposure: 0, shadows: 0, highlights: 0, clarity: 0, vignette: 0 },
  },
  {
    id: "golden_hour",
    name: "Golden Hour",
    description: "Warm sunset radiance & soft amber glow",
    cssFilter: "sepia(0.2) saturate(1.2) contrast(1.05) brightness(1.04)",
    adjustments: { brightness: 8, contrast: 12, saturation: 22, warmth: 35, exposure: 6, shadows: 15, highlights: -8, clarity: 10, vignette: 15 },
  },
  {
    id: "vivid_pop",
    name: "Vivid Pop",
    description: "Punchy vibrant colors & crisp high definition",
    cssFilter: "saturate(1.4) contrast(1.15) brightness(1.02)",
    adjustments: { brightness: 4, contrast: 20, saturation: 38, warmth: 4, exposure: 6, shadows: 8, highlights: -12, clarity: 25, vignette: 8 },
  },
  {
    id: "moody_cinema",
    name: "Moody Cinema",
    description: "Teal shadows & rich amber film tones",
    cssFilter: "contrast(1.2) saturate(0.9) brightness(0.96) hue-rotate(-8deg)",
    adjustments: { brightness: -4, contrast: 25, saturation: -8, warmth: -10, exposure: -5, shadows: 20, highlights: -20, clarity: 18, vignette: 28 },
  },
  {
    id: "vintage_1970",
    name: "Vintage 1970",
    description: "Nostalgic faded matte with warm sepia grain",
    cssFilter: "sepia(0.35) contrast(0.95) saturate(0.85) brightness(1.05)",
    adjustments: { brightness: 10, contrast: -6, saturation: -15, warmth: 28, exposure: 8, shadows: 25, highlights: -15, clarity: -5, vignette: 20 },
  },
  {
    id: "noir_bw",
    name: "Noir B&W",
    description: "Classic high-contrast silver monochrome",
    cssFilter: "grayscale(1) contrast(1.35) brightness(1.02)",
    adjustments: { brightness: 2, contrast: 35, saturation: -100, warmth: 0, exposure: 4, shadows: -10, highlights: 10, clarity: 30, vignette: 25 },
  },
  {
    id: "pastel_dream",
    name: "Pastel Dream",
    description: "Soft lifted blacks with airy romantic highlights",
    cssFilter: "brightness(1.08) contrast(0.92) saturate(1.1)",
    adjustments: { brightness: 15, contrast: -12, saturation: 14, warmth: 12, exposure: 12, shadows: 35, highlights: -8, clarity: -8, vignette: 5 },
  },
  {
    id: "clean_editorial",
    name: "Editorial Clean",
    description: "Bright, sharp luxury magazine portrait tone",
    cssFilter: "contrast(1.08) brightness(1.04) saturate(1.05)",
    adjustments: { brightness: 6, contrast: 14, saturation: 8, warmth: -4, exposure: 8, shadows: 12, highlights: -15, clarity: 22, vignette: 0 },
  },
  {
    id: "sunset_ember",
    name: "Sunset Ember",
    description: "Rich terracotta, copper & rose velvet glow",
    cssFilter: "sepia(0.25) hue-rotate(330deg) saturate(1.25) contrast(1.1)",
    adjustments: { brightness: 6, contrast: 16, saturation: 26, warmth: 45, exposure: 4, shadows: 10, highlights: -10, clarity: 12, vignette: 22 },
  },
  {
    id: "emerald_forest",
    name: "Emerald Crisp",
    description: "Lush botanical greens & deep organic shadows",
    cssFilter: "hue-rotate(12deg) contrast(1.18) saturate(1.12)",
    adjustments: { brightness: 0, contrast: 20, saturation: 16, warmth: -15, exposure: 0, shadows: 14, highlights: -12, clarity: 20, vignette: 18 },
  },
];

interface PhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageTitle?: string;
}

export function PhotoEditorModal({ isOpen, onClose, imageUrl, imageTitle = "Event Memory" }: PhotoEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"adjust" | "filters" | "crop">("adjust");
  const [selectedFilter, setSelectedFilter] = useState<string>("original");
  
  // Adjustment Sliders
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [warmth, setWarmth] = useState(0);
  const [exposure, setExposure] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [vignette, setVignette] = useState(0);

  // Transform
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"original" | "1:1" | "4:5" | "16:9" | "9:16">("original");

  // Comparison & AI Analysis
  const [isComparing, setIsComparing] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isAiEnhanced, setIsAiEnhanced] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Render to canvas with silky requestAnimationFrame batching
  const renderCanvas = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const img = originalImageRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let srcW = img.naturalWidth || img.width || 800;
      let srcH = img.naturalHeight || img.height || 600;

      let cropX = 0;
      let cropY = 0;
      let cropW = srcW;
      let cropH = srcH;

      if (aspectRatio === "1:1") {
        const minDim = Math.min(srcW, srcH);
        cropX = (srcW - minDim) / 2;
        cropY = (srcH - minDim) / 2;
        cropW = minDim;
        cropH = minDim;
      } else if (aspectRatio === "4:5") {
        const targetRatio = 4 / 5;
        if (srcW / srcH > targetRatio) {
          cropW = srcH * targetRatio;
          cropH = srcH;
          cropX = (srcW - cropW) / 2;
          cropY = 0;
        } else {
          cropW = srcW;
          cropH = srcW / targetRatio;
          cropX = 0;
          cropY = (srcH - cropH) / 2;
        }
      } else if (aspectRatio === "16:9") {
        const targetRatio = 16 / 9;
        if (srcW / srcH > targetRatio) {
          cropW = srcH * targetRatio;
          cropH = srcH;
          cropX = (srcW - cropW) / 2;
          cropY = 0;
        } else {
          cropW = srcW;
          cropH = srcW / targetRatio;
          cropX = 0;
          cropY = (srcH - cropH) / 2;
        }
      } else if (aspectRatio === "9:16") {
        const targetRatio = 9 / 16;
        if (srcW / srcH > targetRatio) {
          cropW = srcH * targetRatio;
          cropH = srcH;
          cropX = (srcW - cropW) / 2;
          cropY = 0;
        } else {
          cropW = srcW;
          cropH = srcW / targetRatio;
          cropX = 0;
          cropY = (srcH - cropH) / 2;
        }
      }

      const is90or270 = rotation === 90 || rotation === 270;
      canvas.width = Math.round(is90or270 ? cropH : cropW);
      canvas.height = Math.round(is90or270 ? cropW : cropH);

      ctx.save();

      // Rotate & Flip
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);

      // Apply CSS Filter string if not comparing
      if (!isComparing) {
        const bVal = 100 + brightness + exposure + (shadows > 0 ? shadows * 0.25 : 0) + (highlights < 0 ? highlights * 0.2 : 0);
        const cVal = 100 + contrast + (clarity > 0 ? clarity * 0.35 : 0);
        const sVal = 100 + saturation;
        const sepiaVal = warmth > 0 ? (warmth / 100) * 0.4 : 0;
        const hueVal = warmth < 0 ? (warmth / 100) * 18 : 0;

        ctx.filter = `brightness(${Math.max(10, bVal)}%) contrast(${Math.max(10, cVal)}%) saturate(${Math.max(0, sVal)}%) sepia(${sepiaVal}) hue-rotate(${hueVal}deg)`;
      } else {
        ctx.filter = "none";
      }

      ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        -cropW / 2, -cropH / 2, cropW, cropH
      );

      ctx.restore();

      // Render Vignette
      if (vignette > 0 && !isComparing) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.3,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, `rgba(0,0,0,${(vignette / 100) * 0.75})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
  }, [
    brightness, contrast, saturation, warmth, exposure, shadows, highlights, 
    clarity, vignette, rotation, flipH, aspectRatio, isComparing
  ]);

  // Robust ONE-TIME image loader when modal opens or imageUrl changes
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    // Reset controls once on image open
    setSelectedFilter("original");
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setWarmth(0);
    setExposure(0);
    setShadows(0);
    setHighlights(0);
    setClarity(0);
    setVignette(0);
    setRotation(0);
    setFlipH(false);
    setAspectRatio("original");
    setIsAiEnhanced(false);
    setIsImageLoading(true);
    setImageError(false);

    let isMounted = true;
    let localBlobUrl: string | null = null;

    const startLoad = async () => {
      try {
        let blob: Blob | null = null;
        try {
          const res = await fetch(imageUrl);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch {}

        if (!blob) {
          try {
            const res = await api.get(imageUrl, { responseType: "blob" });
            blob = res.data;
          } catch {}
        }

        const sourceUrl = blob ? (localBlobUrl = URL.createObjectURL(blob)) : imageUrl;

        const img = new Image();
        img.onload = async () => {
          if (!isMounted) return;
          originalImageRef.current = img;
          setIsImageLoading(false);
          
          const res = await analyzeImage(img);
          if (isMounted) {
            setAnalysis(res);
          }
        };

        img.onerror = () => {
          const fallback = new Image();
          fallback.onload = async () => {
            if (!isMounted) return;
            originalImageRef.current = fallback;
            setIsImageLoading(false);
            const res = await analyzeImage(fallback);
            if (isMounted) setAnalysis(res);
          };
          fallback.onerror = () => {
            if (isMounted) {
              setIsImageLoading(false);
              setImageError(true);
            }
          };
          fallback.src = imageUrl;
        };

        if (blob) {
          img.src = sourceUrl;
        } else {
          img.crossOrigin = "anonymous";
          img.src = sourceUrl;
        }
      } catch {
        if (isMounted) {
          setIsImageLoading(false);
          setImageError(true);
        }
      }
    };

    startLoad();

    return () => {
      isMounted = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [isOpen, imageUrl]); // DO NOT include renderCanvas here!

  // Re-draw whenever any slider or adjustment changes
  useEffect(() => {
    if (!isImageLoading && originalImageRef.current) {
      renderCanvas();
    }
  }, [renderCanvas, isImageLoading]);

  const handleReset = () => {
    setSelectedFilter("original");
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setWarmth(0);
    setExposure(0);
    setShadows(0);
    setHighlights(0);
    setClarity(0);
    setVignette(0);
    setRotation(0);
    setFlipH(false);
    setAspectRatio("original");
    setIsAiEnhanced(false);
  };

  const handleApplyFilter = (preset: FilterPreset) => {
    setSelectedFilter(preset.id);
    setBrightness(preset.adjustments.brightness);
    setContrast(preset.adjustments.contrast);
    setSaturation(preset.adjustments.saturation);
    setWarmth(preset.adjustments.warmth);
    setExposure(preset.adjustments.exposure);
    setShadows(preset.adjustments.shadows);
    setHighlights(preset.adjustments.highlights);
    setClarity(preset.adjustments.clarity);
    setVignette(preset.adjustments.vignette);
    setIsAiEnhanced(false);
  };

  const handleAiAutoEnhance = () => {
    if (!analysis) return;
    const rec = analysis.recommendedSettings;
    setBrightness(rec.brightness);
    setContrast(rec.contrast);
    setSaturation(rec.saturation);
    setWarmth(rec.warmth);
    setExposure(rec.exposure);
    setShadows(rec.shadows);
    setHighlights(rec.highlights);
    setClarity(rec.clarity);
    setSelectedFilter("original");
    setIsAiEnhanced(true);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setTimeout(() => {
      const link = document.createElement("a");
      link.download = `${imageTitle.replace(/\s+/g, "_")}_Memora_Enhanced.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      setIsExporting(false);
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-5xl h-[90vh] bg-white rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden flex flex-col text-stone-900"
        >
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-200 bg-stone-50/70">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C25E2E]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Memora Photo Studio</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500">{imageTitle}</span>
                  {analysis && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.2 bg-amber-100/80 text-[#C25E2E] rounded-full">
                      {analysis.tag}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Auto-Enhance Button */}
              <button
                type="button"
                onClick={handleAiAutoEnhance}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isAiEnhanced
                    ? "bg-amber-100 text-[#C25E2E] border border-amber-300 ring-2 ring-amber-400/20"
                    : "bg-gradient-to-r from-amber-500 to-[#C25E2E] hover:from-amber-600 hover:to-[#A34A20] text-white"
                }`}
                title="1-Click AI Lighting & Color Optimization"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{isAiEnhanced ? "AI Enhanced" : "AI Auto-Enhance"}</span>
              </button>

              {/* Hold to Compare */}
              <button
                type="button"
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer select-none"
                title="Press & hold to view original"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compare</span>
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                title="Reset all adjustments"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Download Export */}
              <Button
                onClick={handleDownload}
                size="sm"
                className="btn-accent text-xs font-semibold h-8 px-3.5"
                isLoading={isExporting}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export
              </Button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Studio Body */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Canvas Viewport */}
            <div className="flex-1 bg-stone-950 flex items-center justify-center p-4 relative select-none overflow-hidden min-h-[300px]">
              
              {/* Canvas is ALWAYS mounted so ref is never null */}
              <canvas
                ref={canvasRef}
                style={{ 
                  maxWidth: "100%", 
                  maxHeight: "100%", 
                  objectFit: "contain",
                  display: isImageLoading || imageError ? "none" : "block"
                }}
                className="rounded-xl shadow-2xl transition-all duration-75"
              />

              {/* Image Loading State */}
              {isImageLoading && (
                <div className="flex flex-col items-center justify-center text-stone-400 gap-2.5">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C25E2E]" />
                  <span className="text-xs text-stone-300 font-medium">Loading high-res photo into Studio...</span>
                </div>
              )}

              {/* Image Error Fallback */}
              {imageError && !isImageLoading && (
                <div className="text-center text-stone-400 text-xs space-y-2 p-6">
                  <ImageIcon className="w-10 h-10 mx-auto text-stone-600 mb-2" />
                  <p className="font-semibold text-stone-200">Unable to load image for editing</p>
                  <p className="text-stone-500">The photo URL could not be accessed by the browser.</p>
                </div>
              )}
              
              {isComparing && !isImageLoading && (
                <div className="absolute top-6 left-6 px-3 py-1 bg-black/80 text-white text-[11px] font-bold rounded-full border border-white/20 backdrop-blur-sm z-10">
                  ORIGINAL UNEDITED
                </div>
              )}

              {isAiEnhanced && !isComparing && !isImageLoading && (
                <div className="absolute top-6 left-6 px-3 py-1 bg-amber-500/90 text-white text-[11px] font-bold rounded-full shadow-md flex items-center gap-1 z-10">
                  <Sparkles className="w-3 h-3" />
                  AI AUTO-ENHANCED
                </div>
              )}
            </div>

            {/* Editing Controls Sidebar */}
            <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-stone-200 flex flex-col h-72 lg:h-full">
              
              {/* Tabs */}
              <div className="flex border-b border-stone-200 bg-stone-50/60 p-1.5 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("adjust")}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "adjust"
                      ? "bg-white text-[#C25E2E] shadow-xs border border-stone-200"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Adjust
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("filters")}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "filters"
                      ? "bg-white text-[#C25E2E] shadow-xs border border-stone-200"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Filters ({FILTER_PRESETS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("crop")}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "crop"
                      ? "bg-white text-[#C25E2E] shadow-xs border border-stone-200"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  Transform
                </button>
              </div>

              {/* Scrollable Tool Panel */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                
                {/* TAB 1: ADJUSTMENTS */}
                {activeTab === "adjust" && (
                  <div className="space-y-4">
                    
                    {/* Brightness */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-[#C25E2E]" /> Brightness</span>
                        <span className="font-mono text-stone-500">{brightness > 0 ? `+${brightness}` : brightness}</span>
                      </div>
                      <input
                        type="range" min="-100" max="100" value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                    {/* Contrast */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span className="flex items-center gap-1.5"><Contrast className="w-3.5 h-3.5 text-[#C25E2E]" /> Contrast</span>
                        <span className="font-mono text-stone-500">{contrast > 0 ? `+${contrast}` : contrast}</span>
                      </div>
                      <input
                        type="range" min="-100" max="100" value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                    {/* Saturation */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-[#C25E2E]" /> Saturation</span>
                        <span className="font-mono text-stone-500">{saturation > 0 ? `+${saturation}` : saturation}</span>
                      </div>
                      <input
                        type="range" min="-100" max="100" value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                    {/* Warmth */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-[#C25E2E]" /> Warmth / Tone</span>
                        <span className="font-mono text-stone-500">{warmth > 0 ? `+${warmth}` : warmth}</span>
                      </div>
                      <input
                        type="range" min="-100" max="100" value={warmth}
                        onChange={(e) => setWarmth(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                    {/* Exposure */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span className="flex items-center gap-1.5">Exposure Bias</span>
                        <span className="font-mono text-stone-500">{exposure > 0 ? `+${exposure}` : exposure}</span>
                      </div>
                      <input
                        type="range" min="-100" max="100" value={exposure}
                        onChange={(e) => setExposure(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                    {/* Shadows */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span className="flex items-center gap-1.5">Lift Shadows</span>
                        <span className="font-mono text-stone-500">{shadows > 0 ? `+${shadows}` : shadows}</span>
                      </div>
                      <input
                        type="range" min="-100" max="100" value={shadows}
                        onChange={(e) => setShadows(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span className="flex items-center gap-1.5">Recover Highlights</span>
                        <span className="font-mono text-stone-500">{highlights > 0 ? `+${highlights}` : highlights}</span>
                      </div>
                      <input
                        type="range" min="-100" max="100" value={highlights}
                        onChange={(e) => setHighlights(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                    {/* Clarity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span className="flex items-center gap-1.5">Clarity & Edge Detail</span>
                        <span className="font-mono text-stone-500">{clarity > 0 ? `+${clarity}` : clarity}</span>
                      </div>
                      <input
                        type="range" min="-100" max="100" value={clarity}
                        onChange={(e) => setClarity(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                    {/* Vignette */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span>Vignette Edge</span>
                        <span className="font-mono text-stone-500">+{vignette}</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={vignette}
                        onChange={(e) => setVignette(Number(e.target.value))}
                        className="w-full accent-[#C25E2E] cursor-pointer"
                      />
                    </div>

                  </div>
                )}

                {/* TAB 2: FILTERS POOL */}
                {activeTab === "filters" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {FILTER_PRESETS.map((filter) => (
                      <button
                        type="button"
                        key={filter.id}
                        onClick={() => handleApplyFilter(filter)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          selectedFilter === filter.id
                            ? "bg-amber-50/80 border-[#C25E2E] ring-2 ring-amber-500/20"
                            : "bg-stone-50 border-stone-200/80 hover:bg-stone-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-stone-900 text-xs">{filter.name}</span>
                          {selectedFilter === filter.id && <Check className="w-3.5 h-3.5 text-[#C25E2E]" />}
                        </div>
                        <span className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">
                          {filter.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* TAB 3: TRANSFORM & CROP */}
                {activeTab === "crop" && (
                  <div className="space-y-5">
                    
                    {/* Rotate & Flip */}
                    <div className="space-y-2">
                      <label className="font-semibold text-stone-700 block">Rotate & Orientation</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                          className="py-2.5 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-stone-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" /> +90°
                        </button>
                        <button
                          type="button"
                          onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                          className="py-2.5 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-stone-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> -90°
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlipH(!flipH)}
                          className={`py-2.5 px-3 border rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            flipH ? "bg-amber-100 text-[#C25E2E] border-amber-300" : "bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100"
                          }`}
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" /> Flip
                        </button>
                      </div>
                    </div>

                    {/* Aspect Ratio Presets */}
                    <div className="space-y-2">
                      <label className="font-semibold text-stone-700 block">Aspect Ratio Crop</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "original", label: "Original Fit" },
                          { id: "1:1", label: "1:1 Square" },
                          { id: "4:5", label: "4:5 Portrait (IG)" },
                          { id: "16:9", label: "16:9 Cinema" },
                          { id: "9:16", label: "9:16 Story" },
                        ].map((ar) => (
                          <button
                            type="button"
                            key={ar.id}
                            onClick={() => setAspectRatio(ar.id as any)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              aspectRatio === ar.id
                                ? "bg-[#C25E2E] text-white shadow-xs border-[#C25E2E]"
                                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {ar.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
