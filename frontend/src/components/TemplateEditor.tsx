"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Image as ImageIcon, Wind, Music, Play, Pause, FastForward, 
  Settings2, X, Wand2, Volume2, Shuffle, Film, Layers, CheckCircle2, RotateCcw
} from "lucide-react";
import { 
  SOUNDTRACK_CATALOG, SoundtrackTrack, autoSelectSong, webAudioSynth 
} from "@/lib/reelAudio";
import { 
  VIDEO_EFFECT_PRESETS, VideoEffectType, autoEditReel 
} from "@/lib/reelEditor";

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip';
export type BackgroundType = 'solid' | 'gradient' | 'blur';
export type SpeedType = 'slow' | 'normal' | 'fast';

export interface ReelSettings {
  template: 'minimal' | 'vintage' | 'party' | 'custom';
  transition: TransitionType;
  background: BackgroundType;
  speed: SpeedType;
  musicUrl: string | null;
  autoMusic?: boolean;
  selectedTrackId?: string;
  videoEffect?: VideoEffectType;
  kenBurns?: boolean;
  showIntroCard?: boolean;
  eventTitle?: string;
  eventDescription?: string;
  memoriesCount?: number;
}

export const defaultSettings: ReelSettings = {
  template: 'minimal',
  transition: 'fade',
  background: 'blur',
  speed: 'normal',
  musicUrl: null,
  autoMusic: true,
  selectedTrackId: 'celebration_golden',
  videoEffect: 'auto',
  kenBurns: true,
  showIntroCard: true,
};

interface TemplateEditorProps {
  settings: ReelSettings;
  onChange: (settings: ReelSettings) => void;
  onPlay: () => void;
  onClose: () => void;
  eventTitle?: string;
  eventDescription?: string;
  memoriesCount?: number;
}

export function TemplateEditor({ 
  settings, 
  onChange, 
  onPlay, 
  onClose,
  eventTitle = "Event Highlights",
  eventDescription = "",
  memoriesCount = 12
}: TemplateEditorProps) {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'auto' | 'music' | 'effects' | 'pace'>('auto');
  const [autoEditMessage, setAutoEditMessage] = useState<string | null>(null);

  const selectedTrack = SOUNDTRACK_CATALOG.find((t) => t.id === settings.selectedTrackId) || SOUNDTRACK_CATALOG[0];

  const update = (key: keyof ReelSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  // Preview Music handling
  const togglePlayAudioPreview = (track: SoundtrackTrack) => {
    if (!webAudioSynth) return;

    if (isPlayingPreview && selectedTrack.id === track.id) {
      webAudioSynth.stop();
      setIsPlayingPreview(false);
    } else {
      webAudioSynth.playTrack(track);
      setIsPlayingPreview(true);
      if (settings.selectedTrackId !== track.id) {
        update('selectedTrackId', track.id);
        update('musicUrl', track.audioUrl || null);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (webAudioSynth) webAudioSynth.stop();
    };
  }, []);

  // 1-Click AI Auto Edit
  const handleTriggerAutoEdit = () => {
    const result = autoEditReel(memoriesCount, eventTitle, eventDescription);
    onChange({
      ...settings,
      ...result.settings,
      eventTitle,
      memoriesCount
    });
    setAutoEditMessage(`✨ AI applied "${result.track.title}" + ${result.effect.name} effects!`);
    setTimeout(() => setAutoEditMessage(null), 4000);
  };

  // Auto Song Selection re-roll
  const handleAutoSelectSong = () => {
    const { track, matchReason } = autoSelectSong(eventTitle, eventDescription, memoriesCount);
    update('selectedTrackId', track.id);
    update('musicUrl', track.audioUrl || null);
    update('autoMusic', true);
    setAutoEditMessage(`🎵 Auto-matched "${track.title}" (${matchReason})`);
    setTimeout(() => setAutoEditMessage(null), 3500);

    if (webAudioSynth && isPlayingPreview) {
      webAudioSynth.playTrack(track);
    }
  };

  return (
    <div className="w-full max-w-md h-full max-h-[88vh] overflow-y-auto bg-white border border-stone-200/90 rounded-3xl shadow-2xl flex flex-col text-stone-900 font-sans">
      {/* Top Header */}
      <div className="p-4 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C25E2E]/10 flex items-center justify-center text-[#C25E2E]">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-stone-900 block leading-tight">AI Reel Studio</span>
            <span className="text-[10px] text-stone-500">Auto song selection & video effects</span>
          </div>
        </div>
        <button
          onClick={() => {
            if (webAudioSynth) webAudioSynth.stop();
            onClose();
          }}
          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 px-4 gap-1 text-[11px] font-semibold bg-stone-50/70">
        <button
          onClick={() => setActiveTab('auto')}
          className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'auto'
              ? "border-[#C25E2E] text-[#C25E2E]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" /> AI Auto-Edit
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'music'
              ? "border-[#C25E2E] text-[#C25E2E]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Music className="w-3.5 h-3.5" /> Auto Music
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'effects'
              ? "border-[#C25E2E] text-[#C25E2E]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Film className="w-3.5 h-3.5" /> Video Effects
        </button>
        <button
          onClick={() => setActiveTab('pace')}
          className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'pace'
              ? "border-[#C25E2E] text-[#C25E2E]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <FastForward className="w-3.5 h-3.5" /> Transitions
        </button>
      </div>
      
      <div className="p-5 space-y-5 flex-1 text-xs">
        
        {/* Status Toast Banner */}
        {autoEditMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-[#A34A20] font-medium flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 shrink-0 text-[#C25E2E]" />
            <span>{autoEditMessage}</span>
          </div>
        )}

        {/* TAB 1: AI AUTO-EDIT */}
        {activeTab === 'auto' && (
          <div className="space-y-4">
            {/* 1-Click Master AI Button */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF5F0] via-white to-amber-50/50 border border-[#C25E2E]/25 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C25E2E]" /> 1-Click AI Auto Reel Edit
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    Automatically pairs the best soundtrack, syncs beat pacing, applies cinematic Ken Burns motion, and color-grades your memories based on event vibes.
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleTriggerAutoEdit}
                className="w-full py-2.5 px-4 bg-[#C25E2E] hover:bg-[#A34A20] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Auto-Edit Reel for &quot;{eventTitle}&quot;</span>
              </button>
            </div>

            {/* Quick Summary of Active Settings */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Active AI Recipe
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col gap-1">
                  <span className="text-stone-500 font-medium flex items-center gap-1">
                    <Music className="w-3 h-3 text-[#C25E2E]" /> Soundtrack
                  </span>
                  <span className="font-semibold text-stone-900 truncate">{selectedTrack.title}</span>
                  <span className="text-[10px] text-stone-500 capitalize">{selectedTrack.mood} • {selectedTrack.bpm} BPM</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col gap-1">
                  <span className="text-stone-500 font-medium flex items-center gap-1">
                    <Film className="w-3 h-3 text-[#C25E2E]" /> Video Effect
                  </span>
                  <span className="font-semibold text-stone-900 truncate">
                    {VIDEO_EFFECT_PRESETS[settings.videoEffect || 'auto'].name}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {settings.kenBurns ? "Ken Burns ON" : "Static Frame"}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2 pt-1 border-t border-stone-100">
              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-[#C25E2E]" />
                  <div>
                    <span className="font-semibold text-stone-800 block text-xs">Cinematic Ken Burns Motion</span>
                    <span className="text-[10px] text-stone-500">Smooth slow zoom & pan on photos</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.kenBurns !== false}
                  onChange={(e) => update('kenBurns', e.target.checked)}
                  className="w-4 h-4 accent-[#C25E2E] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C25E2E]" />
                  <div>
                    <span className="font-semibold text-stone-800 block text-xs">AI Intro Title Card</span>
                    <span className="text-[10px] text-stone-500">Cinematic event title intro screen</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showIntroCard !== false}
                  onChange={(e) => update('showIntroCard', e.target.checked)}
                  className="w-4 h-4 accent-[#C25E2E] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: AUTO SONG SELECTION */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold uppercase tracking-wider text-stone-600 block text-[11px]">
                  Soundtrack Selection
                </span>
                <span className="text-[11px] text-stone-500">Royalty-free music with auto-tempo matching</span>
              </div>
              <button
                type="button"
                onClick={handleAutoSelectSong}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#C25E2E] border border-amber-200/80 font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                title="Automatically analyze event and select best soundtrack"
              >
                <Shuffle className="w-3 h-3" /> Auto-Select
              </button>
            </div>

            {/* Current Playing Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-stone-900 text-white flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePlayAudioPreview(selectedTrack)}
                  className="w-9 h-9 rounded-full bg-[#C25E2E] hover:bg-[#A34A20] flex items-center justify-center text-white shrink-0 shadow-xs cursor-pointer transition-transform active:scale-95"
                >
                  {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="truncate">
                  <div className="font-bold text-xs truncate flex items-center gap-1.5">
                    <span>{selectedTrack.title}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-white/90">
                      {selectedTrack.tag}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {selectedTrack.artist} • {selectedTrack.bpm} BPM • {isPlayingPreview ? "Previewing..." : "Ready to play"}
                  </div>
                </div>
              </div>
              <Volume2 className="w-4 h-4 text-stone-400 shrink-0" />
            </div>

            {/* Track Catalog Cards */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {SOUNDTRACK_CATALOG.map((track) => {
                const isSelected = settings.selectedTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      update('selectedTrackId', track.id);
                      update('musicUrl', track.audioUrl || null);
                      update('autoMusic', false);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? "bg-[#FFF8F5] border-[#C25E2E] shadow-xs"
                        : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayAudioPreview(track);
                        }}
                        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        {isPlayingPreview && selectedTrack.id === track.id ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3 ml-0.5" />
                        )}
                      </button>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-stone-900 truncate">
                          {track.title}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {track.description}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span 
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${track.accentColor}20`, color: track.accentColor }}
                      >
                        {track.bpm} BPM
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AUTO VIDEO EFFECTS */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            <div>
              <span className="font-semibold uppercase tracking-wider text-stone-600 block text-[11px]">
                Cinematic Color Grading & Effects
              </span>
              <span className="text-[11px] text-stone-500">Live aesthetic color grade and atmosphere styling</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(VIDEO_EFFECT_PRESETS) as VideoEffectType[]).map((fxKey) => {
                const preset = VIDEO_EFFECT_PRESETS[fxKey];
                const isSelected = (settings.videoEffect || 'auto') === fxKey;
                return (
                  <button
                    type="button"
                    key={fxKey}
                    onClick={() => update('videoEffect', fxKey)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#FFF8F5] border-[#C25E2E] shadow-xs ring-1 ring-[#C25E2E]/20"
                        : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-stone-900 text-xs">{preset.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#C25E2E]" />}
                    </div>
                    <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Frame Backdrop */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 text-[11px]">
                <ImageIcon className="w-3.5 h-3.5 text-[#C25E2E]" /> Frame Backdrop
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['blur', 'gradient', 'solid'] as BackgroundType[]).map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => update('background', b)}
                    className={`py-2 px-3 rounded-xl font-medium capitalize transition-all cursor-pointer text-xs ${
                      settings.background === b
                        ? "bg-[#C25E2E] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200/70"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRANSITIONS & PACE */}
        {activeTab === 'pace' && (
          <div className="space-y-4">
            {/* Speed / Pace */}
            <div className="space-y-2">
              <label className="font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 text-[11px]">
                <FastForward className="w-3.5 h-3.5 text-[#C25E2E]" /> Playback Pace
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['slow', 'normal', 'fast'] as SpeedType[]).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => update('speed', s)}
                    className={`py-2 px-3 rounded-xl font-medium capitalize transition-all cursor-pointer text-xs ${
                      settings.speed === s
                        ? "bg-[#C25E2E] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200/70"
                    }`}
                  >
                    {s} ({s === 'slow' ? '6s' : s === 'fast' ? '2s' : '4s'})
                  </button>
                ))}
              </div>
            </div>

            {/* Transition Style */}
            <div className="space-y-2">
              <label className="font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 text-[11px]">
                <Wind className="w-3.5 h-3.5 text-[#C25E2E]" /> Cut Transition
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['fade', 'slide', 'zoom', 'flip'] as TransitionType[]).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => update('transition', t)}
                    className={`py-2 px-3 rounded-xl font-medium capitalize transition-all cursor-pointer text-xs ${
                      settings.transition === t
                        ? "bg-[#C25E2E] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Play Action */}
        <div className="pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => {
              if (webAudioSynth) webAudioSynth.stop();
              onPlay();
            }}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Memory Reel with Music & Effects</span>
          </button>
        </div>

      </div>
    </div>
  );
}
