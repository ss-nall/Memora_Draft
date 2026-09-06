"use client";

import { useState } from "react";
import { Sparkles, Image as ImageIcon, Wind, Music, Play, FastForward, Settings2, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip';
export type BackgroundType = 'solid' | 'gradient' | 'blur';
export type SpeedType = 'slow' | 'normal' | 'fast';

export interface ReelSettings {
  template: 'minimal' | 'vintage' | 'party' | 'custom';
  transition: TransitionType;
  background: BackgroundType;
  speed: SpeedType;
  musicUrl: string | null;
}

export const defaultSettings: ReelSettings = {
  template: 'minimal',
  transition: 'fade',
  background: 'solid',
  speed: 'normal',
  musicUrl: null,
};

interface TemplateEditorProps {
  settings: ReelSettings;
  onChange: (settings: ReelSettings) => void;
  onPlay: () => void;
  onClose: () => void;
}

export function TemplateEditor({ settings, onChange, onPlay, onClose }: TemplateEditorProps) {
  const update = (key: keyof ReelSettings, value: any) => {
    onChange({ ...settings, [key]: value, template: 'custom' });
  };

  return (
    <div className="w-full max-w-sm h-full max-h-[85vh] overflow-y-auto bg-white border border-stone-200/90 rounded-3xl shadow-2xl flex flex-col text-stone-900 font-sans">
      <div className="p-4 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[#C25E2E]" />
          <span className="text-sm font-bold text-stone-900">Reel Settings</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-5 space-y-5 flex-1 text-xs">
        
        {/* Speed */}
        <div className="space-y-2">
          <label className="font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <FastForward className="w-3.5 h-3.5 text-[#C25E2E]" /> Playback Pace
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['slow', 'normal', 'fast'] as SpeedType[]).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => update('speed', s)}
                className={`py-2 px-3 rounded-xl font-medium capitalize transition-all cursor-pointer ${
                  settings.speed === s
                    ? "bg-[#C25E2E] text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Transition Style */}
        <div className="space-y-2">
          <label className="font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-[#C25E2E]" /> Visual Transition
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['fade', 'slide', 'zoom', 'flip'] as TransitionType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => update('transition', t)}
                className={`py-2 px-3 rounded-xl font-medium capitalize transition-all cursor-pointer ${
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

        {/* Background Style */}
        <div className="space-y-2">
          <label className="font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#C25E2E]" /> Frame Backdrop
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['solid', 'gradient', 'blur'] as BackgroundType[]).map((b) => (
              <button
                type="button"
                key={b}
                onClick={() => update('background', b)}
                className={`py-2 px-3 rounded-xl font-medium capitalize transition-all cursor-pointer ${
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

        <div className="pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Apply & Play Reel
          </button>
        </div>

      </div>
    </div>
  );
}
