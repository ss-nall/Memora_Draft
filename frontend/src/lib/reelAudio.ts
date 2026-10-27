"use client";

// ==============================================================================
// MEMORA AI REEL AUDIO & SOUNDTRACK ENGINE
// Royalty-free soundtrack catalog + intelligent auto-music matcher + Web Audio synthesizer fallback
// ==============================================================================

export type SoundtrackMood = "celebration" | "acoustic" | "chill" | "cinematic" | "retro";

export interface SoundtrackTrack {
  id: string;
  title: string;
  artist: string;
  mood: SoundtrackMood;
  bpm: number;
  tempo: "fast" | "normal" | "slow";
  description: string;
  recommendedFor: string[];
  accentColor: string;
  tag: string;
  audioUrl?: string;
  // Synthesizer parameters for offline/immediate Web Audio playback
  synthProgression: { root: number; chords: number[][]; beatPattern: number[]; type: OscillatorType };
}

export const SOUNDTRACK_CATALOG: SoundtrackTrack[] = [
  {
    id: "celebration_golden",
    title: "Golden Celebration",
    artist: "Memora Studio",
    mood: "celebration",
    bpm: 122,
    tempo: "fast",
    description: "Upbeat festive rhythms, joyful melodies & celebratory bounce",
    recommendedFor: ["party", "birthday", "dance", "club", "celebration", "fest", "new year", "festival", "gathering"],
    accentColor: "#F59E0B",
    tag: "High Energy",
    audioUrl: "https://actions.google.com/sounds/v1/foley/camera_flashes.ogg", // safe public stream
    synthProgression: {
      root: 261.63, // C4
      chords: [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 349.23], // G7
      ],
      beatPattern: [1, 0, 1, 1],
      type: "triangle",
    },
  },
  {
    id: "acoustic_memories",
    title: "Heartfelt Acoustic",
    artist: "Acoustic Serenade",
    mood: "acoustic",
    bpm: 82,
    tempo: "slow",
    description: "Warm fingerpicked guitar chords, gentle piano & emotional depth",
    recommendedFor: ["wedding", "anniversary", "family", "reunion", "love", "vows", "dinner", "ceremony", "memorial"],
    accentColor: "#EC4899",
    tag: "Emotional & Warm",
    synthProgression: {
      root: 220.00, // A3
      chords: [
        [220.00, 277.18, 329.63, 415.30], // Amaj7
        [185.00, 220.00, 277.18, 329.63], // F#m7
        [146.83, 185.00, 220.00, 277.18], // Dmaj7
        [164.81, 207.65, 246.94, 293.66], // E7
      ],
      beatPattern: [1, 0, 0, 1],
      type: "sine",
    },
  },
  {
    id: "chill_sunset",
    title: "Summer Sunset Lo-Fi",
    artist: "Horizon Beats",
    mood: "chill",
    bpm: 90,
    tempo: "normal",
    description: "Smooth ambient Rhodes, relaxed bassline & gentle mellow groove",
    recommendedFor: ["trip", "vacation", "beach", "summer", "travel", "friends", "hangout", "roadtrip", "weekend", "sunset"],
    accentColor: "#06B6D4",
    tag: "Relaxed Vibe",
    synthProgression: {
      root: 174.61, // F3
      chords: [
        [174.61, 220.00, 261.63, 311.13], // F7
        [233.08, 293.66, 349.23, 415.30], // Bb7
        [207.65, 261.63, 311.13, 369.99], // Ab7
        [155.56, 196.00, 233.08, 277.18], // Eb7
      ],
      beatPattern: [1, 0, 1, 0],
      type: "sine",
    },
  },
  {
    id: "cinematic_horizons",
    title: "Cinematic Horizons",
    artist: "Epic Symphony",
    mood: "cinematic",
    bpm: 76,
    tempo: "slow",
    description: "Grand orchestral swells, soaring strings & milestone drama",
    recommendedFor: ["graduation", "gala", "awards", "milestone", "summit", "conference", "corporate", "launch", "speech"],
    accentColor: "#8B5CF6",
    tag: "Grand & Majestic",
    synthProgression: {
      root: 196.00, // G3
      chords: [
        [196.00, 246.94, 293.66, 370.00], // Gmaj7
        [164.81, 196.00, 246.94, 293.66], // Em7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [146.83, 185.00, 220.00, 261.63], // D7
      ],
      beatPattern: [1, 0, 0, 0],
      type: "triangle",
    },
  },
  {
    id: "vintage_nostalgia",
    title: "Nostalgia Dreamwave",
    artist: "Retro Tape Collective",
    mood: "retro",
    bpm: 104,
    tempo: "normal",
    description: "Vintage tape-saturated keys, warm analog synth & nostalgic chords",
    recommendedFor: ["retro", "vintage", "throwback", "flashback", "oldies", "classic", "polaroid", "heritage"],
    accentColor: "#D97706",
    tag: "Retro 90s",
    synthProgression: {
      root: 246.94, // B3
      chords: [
        [246.94, 293.66, 369.99, 440.00], // Bm7
        [196.00, 246.94, 293.66, 369.99], // Gmaj7
        [174.61, 220.00, 261.63, 329.63], // F#m7
        [220.00, 261.63, 329.63, 392.00], // A7
      ],
      beatPattern: [1, 1, 0, 1],
      type: "sawtooth",
    },
  },
];

/**
 * Intelligent AI Song Auto-Selector:
 * Analyzes event title, description, and photo composition to select the most appropriate soundtrack.
 */
export function autoSelectSong(
  eventTitle: string = "",
  eventDescription: string = "",
  photoCount: number = 0
): { track: SoundtrackTrack; matchReason: string } {
  const combinedText = `${eventTitle} ${eventDescription}`.toLowerCase();

  let bestTrack = SOUNDTRACK_CATALOG[0];
  let highestScore = 0;
  let matchReason = "Matched to celebratory & energetic event moments";

  for (const track of SOUNDTRACK_CATALOG) {
    let score = 0;
    let matchedKeywords: string[] = [];

    for (const kw of track.recommendedFor) {
      if (combinedText.includes(kw)) {
        score += 3;
        matchedKeywords.push(kw);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestTrack = track;
      if (matchedKeywords.length > 0) {
        matchReason = `Auto-matched to "${matchedKeywords[0]}" theme`;
      }
    }
  }

  // Fallback heuristic based on photo collection size
  if (highestScore === 0) {
    if (photoCount > 25) {
      bestTrack = SOUNDTRACK_CATALOG.find((t) => t.id === "celebration_golden") || SOUNDTRACK_CATALOG[0];
      matchReason = "Selected upbeat festive soundtrack for large photo collection";
    } else if (photoCount < 8) {
      bestTrack = SOUNDTRACK_CATALOG.find((t) => t.id === "acoustic_memories") || SOUNDTRACK_CATALOG[1];
      matchReason = "Selected intimate acoustic melody for personal gallery";
    } else {
      bestTrack = SOUNDTRACK_CATALOG.find((t) => t.id === "chill_sunset") || SOUNDTRACK_CATALOG[2];
      matchReason = "Selected smooth ambient summer groove for balanced gallery";
    }
  }

  return { track: bestTrack, matchReason };
}

/**
 * Web Audio Ambient Music Synthesizer:
 * Zero-dependency, offline-ready melodic background music generator.
 * Runs in all modern mobile and desktop browsers with silky smooth chord transitions.
 */
class WebAudioSynthPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: any = null;
  private currentChordIndex = 0;
  private masterGain: GainNode | null = null;
  private currentTrack: SoundtrackTrack | null = null;
  private volume = 0.4;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public playTrack(track: SoundtrackTrack) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop();
    this.currentTrack = track;
    this.isPlaying = true;
    this.currentChordIndex = 0;

    const synth = track.synthProgression;
    const beatInterval = (60 / track.bpm) * 1000 * 2; // chord interval

    const playChordStep = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const chord = synth.chords[this.currentChordIndex % synth.chords.length];
      const now = this.ctx.currentTime;

      // Play soft harmonic chord voices
      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Filter for warmth
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(synth.type === "sawtooth" ? 800 : 1200, now);

        osc.type = synth.type;
        osc.frequency.setValueAtTime(freq, now);

        // Soft attack and decay envelope
        const baseLevel = 0.08 / (idx + 1);
        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(baseLevel, now + 0.3 + idx * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + (beatInterval / 1000) * 0.95);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + beatInterval / 1000);
      });

      this.currentChordIndex++;
      this.timer = setTimeout(playChordStep, beatInterval);
    };

    playChordStep();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const webAudioSynth = typeof window !== "undefined" ? new WebAudioSynthPlayer() : null;
