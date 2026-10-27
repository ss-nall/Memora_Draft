"use client";

// ==============================================================================
// MEMORA AI REEL EDIT & VIDEO EFFECTS ENGINE
// 1-Click AI Smart Cut + Dynamic Ken Burns + Aesthetic Video Color Grading
// ==============================================================================

import { ReelSettings } from "@/components/TemplateEditor";
import { autoSelectSong, SoundtrackTrack, SOUNDTRACK_CATALOG } from "./reelAudio";

export type VideoEffectType =
  | "auto"
  | "original"
  | "cinematic"
  | "golden_hour"
  | "vibrant_pop"
  | "moody_cinema"
  | "vintage_sepia"
  | "noir";

export interface VideoEffectPreset {
  id: VideoEffectType;
  name: string;
  description: string;
  filterCss: string;
  overlayClass?: string;
  hasVignette: boolean;
  hasParticles: boolean;
  badgeColor: string;
}

export const VIDEO_EFFECT_PRESETS: Record<VideoEffectType, VideoEffectPreset> = {
  auto: {
    id: "auto",
    name: "AI Auto Effect",
    description: "Automatically matches visual mood to event theme & soundtrack",
    filterCss: "none",
    hasVignette: true,
    hasParticles: true,
    badgeColor: "#C25E2E",
  },
  original: {
    id: "original",
    name: "Natural",
    description: "Crisp raw colors without color grade",
    filterCss: "none",
    hasVignette: false,
    hasParticles: false,
    badgeColor: "#78716C",
  },
  cinematic: {
    id: "cinematic",
    name: "Cinematic Film",
    description: "Warm golden highlights, deep cinematic contrast & rich tone curve",
    filterCss: "contrast(1.14) saturate(1.1) brightness(1.02) hue-rotate(-2deg)",
    hasVignette: true,
    hasParticles: false,
    badgeColor: "#6366F1",
  },
  golden_hour: {
    id: "golden_hour",
    name: "Golden Hour",
    description: "Sunset amber radiance, soft bloom & dreamy highlight warmth",
    filterCss: "sepia(0.25) saturate(1.22) contrast(1.08) brightness(1.05)",
    hasVignette: true,
    hasParticles: true,
    badgeColor: "#F59E0B",
  },
  vibrant_pop: {
    id: "vibrant_pop",
    name: "Vibrant Pop",
    description: "Punchy high-dynamic colors, party neon glow & crisp contrast",
    filterCss: "saturate(1.38) contrast(1.18) brightness(1.04)",
    hasVignette: false,
    hasParticles: true,
    badgeColor: "#EC4899",
  },
  moody_cinema: {
    id: "moody_cinema",
    name: "Moody Teal & Orange",
    description: "Hollywood blockbuster aesthetic with teal shadows & amber skin tones",
    filterCss: "contrast(1.22) saturate(0.95) brightness(0.98) hue-rotate(-6deg)",
    hasVignette: true,
    hasParticles: false,
    badgeColor: "#06B6D4",
  },
  vintage_sepia: {
    id: "vintage_sepia",
    name: "Retro Nostalgia",
    description: "1990s film warmth, analog grain & soft vintage memory feel",
    filterCss: "sepia(0.4) contrast(1.1) brightness(0.95)",
    hasVignette: true,
    hasParticles: true,
    badgeColor: "#D97706",
  },
  noir: {
    id: "noir",
    name: "Black & White Noir",
    description: "Timeless dramatic monochrome with deep blacks and bright silver highlights",
    filterCss: "grayscale(1) contrast(1.3) brightness(0.95)",
    hasVignette: true,
    hasParticles: false,
    badgeColor: "#1C1917",
  },
};

export interface AutoEditResult {
  settings: ReelSettings;
  track: SoundtrackTrack;
  effect: VideoEffectPreset;
  titleCard: {
    title: string;
    subtitle: string;
  };
  pacingDurations: number[]; // Duration in ms for each slide
  summary: string;
}

/**
 * 1-Click AI Auto Reel Edit:
 * Analyzes event metadata, photos count, and music rhythm to synthesize
 * the perfect reel settings, beat pacing, intro card, and visual effects.
 */
export function autoEditReel(
  memoriesCount: number = 0,
  eventTitle: string = "Event Highlights",
  eventDescription: string = ""
): AutoEditResult {
  // 1. Auto Song Selection
  const { track, matchReason } = autoSelectSong(eventTitle, eventDescription, memoriesCount);

  // 2. Auto Video Effect Selection based on mood
  let recommendedEffect: VideoEffectType = "cinematic";
  let recommendedTransition: "fade" | "slide" | "zoom" | "flip" = "fade";
  let recommendedBackground: "solid" | "gradient" | "blur" = "blur";

  switch (track.mood) {
    case "celebration":
      recommendedEffect = "vibrant_pop";
      recommendedTransition = "zoom";
      recommendedBackground = "gradient";
      break;
    case "acoustic":
      recommendedEffect = "golden_hour";
      recommendedTransition = "fade";
      recommendedBackground = "blur";
      break;
    case "chill":
      recommendedEffect = "moody_cinema";
      recommendedTransition = "slide";
      recommendedBackground = "blur";
      break;
    case "cinematic":
      recommendedEffect = "cinematic";
      recommendedTransition = "fade";
      recommendedBackground = "solid";
      break;
    case "retro":
      recommendedEffect = "vintage_sepia";
      recommendedTransition = "flip";
      recommendedBackground = "solid";
      break;
  }

  // 3. Beat-Synced Pacing Map (Dynamic pacing instead of rigid static durations)
  // Calculates varying durations: Opening hero (longer), action moments (punchy), climax (medium)
  const baseDuration = (60 / track.bpm) * 1000 * 4; // 4 beats per slide
  const clampedBase = Math.max(2200, Math.min(5000, baseDuration));

  const pacingDurations: number[] = [];
  for (let i = 0; i < Math.max(1, memoriesCount); i++) {
    if (i === 0) {
      pacingDurations.push(clampedBase * 1.25); // Opening hero photo dwells slightly longer
    } else if (i === memoriesCount - 1) {
      pacingDurations.push(clampedBase * 1.3); // Closing memory
    } else if (i % 3 === 0) {
      pacingDurations.push(clampedBase * 0.85); // Quick rhythmic cut
    } else {
      pacingDurations.push(clampedBase);
    }
  }

  const speed: "slow" | "normal" | "fast" =
    track.bpm > 115 ? "fast" : track.bpm < 85 ? "slow" : "normal";

  const settings: ReelSettings = {
    template: track.mood === "retro" ? "vintage" : track.mood === "celebration" ? "party" : "custom",
    transition: recommendedTransition,
    background: recommendedBackground,
    speed,
    musicUrl: track.audioUrl || null,
    autoMusic: true,
    selectedTrackId: track.id,
    videoEffect: recommendedEffect,
    kenBurns: true,
    showIntroCard: true,
  };

  const cleanTitle = eventTitle.replace(/memora/gi, "").trim() || "Memora Memories";
  const titleCard = {
    title: cleanTitle,
    subtitle: `${memoriesCount} Cherished Moments • AI Curated`,
  };

  const summary = `AI Auto-Edit configured with "${track.title}" (${track.bpm} BPM) • ${VIDEO_EFFECT_PRESETS[recommendedEffect].name} grading • Ken Burns motion & beat-synced cuts`;

  return {
    settings,
    track,
    effect: VIDEO_EFFECT_PRESETS[recommendedEffect],
    titleCard,
    pacingDurations,
    summary,
  };
}
