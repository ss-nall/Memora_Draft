"use client";

import { useState } from "react";
import { Sparkles, Image as ImageIcon, Wind, Music, Play, FastForward, Settings2, Eye, Palette, Volume2, Mic, X } from "lucide-react";
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
  const [selectedMusic, setSelectedMusic] = useState<'nostalgic' | 'joyful' | 'epic'>('nostalgic');
  const [selectedVibe, setSelectedVibe] = useState<'analog' | 'modern'>('analog');
  const [aiNarration, setAiNarration] = useState(true);

  const update = (key: keyof ReelSettings, value: any) => {
    onChange({ ...settings, [key]: value, template: 'custom' });
  };

  const handleVibeChange = (vibe: 'analog' | 'modern') => {
    setSelectedVibe(vibe);
    if (vibe === 'analog') {
      onChange({
        template: 'vintage',
        transition: 'fade',
        background: 'solid',
        speed: 'normal',
        musicUrl: null
      });
    } else {
      onChange({
        template: 'party',
        transition: 'zoom',
        background: 'gradient',
        speed: 'fast',
        musicUrl: null
      });
    }
  };

  return (
    <Card className="w-full max-w-sm h-full max-h-[85vh] overflow-y-auto bg-surface-pure border-outline-variant/30 flex flex-col rounded-3xl glass-panel custom-scrollbar">
      <CardHeader className="border-b border-outline-variant/10 pb-4 sticky top-0 bg-surface-pure/90 backdrop-blur z-10 px-6 pt-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-on-surface">
            <Settings2 className="w-5 h-5 text-primary" />
            AI Reel Studio
          </CardTitle>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-surface-container rounded-full text-secondary hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6 flex-1 px-6">
        
        {/* Music Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-secondary uppercase font-label-caps tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-primary" /> Music Selection
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'nostalgic', label: 'Nostalgic' },
              { id: 'joyful', label: 'Joyful' },
              { id: 'epic', label: 'Epic' }
            ].map((music) => (
              <button
                type="button"
                key={music.id}
                onClick={() => setSelectedMusic(music.id as any)}
                className={`py-3 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 border-2 transition-all ${selectedMusic === music.id ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/50 text-secondary'}`}
              >
                <Music className="w-4 h-4" />
                <span>{music.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-secondary uppercase font-label-caps tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-primary" /> Visual Theme
          </label>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Analog Film Card */}
            <div 
              onClick={() => handleVibeChange('analog')}
              className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all p-1 bg-surface-pure ${selectedVibe === 'analog' ? 'border-primary' : 'border-outline-variant/20 hover:border-primary/50'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                className="h-20 w-full object-cover rounded-xl"
                alt="Analog theme illustration"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcvKnWyQZNBIQx8wPVoCqKyJCHHsH6vgeTGhJoA_pefoobzEbNG4p89rCdDaMKZVb3w_V58zje0BGCzOKcIGLwYMGNliqJ5DWltHXACQJ7sywSmwMrbSB-y4rC4FTiDLwj6fFdMs9lrrt1SRc995icjDZZbyGgySBOptxx294piTJHlvuOQl5tPwFKz3fmLACkF3WKLgmiwUWXATBT-bxjiWaZG0OWMroOt99VBIVX0nTZgjo6slnc27amuokZAVzPIO6-BWZ1BwTV"
              />
              <p className="font-label-caps text-[10px] text-center font-bold mt-2 pb-1 text-on-surface">Analog Film</p>
            </div>

            {/* Modern Clean Card */}
            <div 
              onClick={() => handleVibeChange('modern')}
              className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all p-1 bg-surface-pure ${selectedVibe === 'modern' ? 'border-primary' : 'border-outline-variant/20 hover:border-primary/50'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                className="h-20 w-full object-cover rounded-xl"
                alt="Modern theme illustration"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8Bs66ADHqoDk4bHe3uvtWZN3N4O7oDSaRpK7vZ9YtQ0Y8v6wSF3nu6TYzzMVB0cQwOAaxZuL6HXkb9pdLg4EFU2q-gXtVNtbEyEA6AkpSIFNyU13uRKzu-Gr3d6qhniN4dHWjdgGFpCZvGcKBB5S11fPxyaoGFXmcMsLOOY4HzaAlTNG3OdSJiXp3l14ZeaYrHcd5Qc73jlSE6x9YKvg9m6aQQv1KifQWDF0P6dm2iUS3NxSKmVP3tzKajmjS3e01B6wUlY29UY1W"
              />
              <p className="font-label-caps text-[10px] text-center font-bold mt-2 pb-1 text-on-surface">Modern Clean</p>
            </div>

          </div>
        </div>

        {/* Transition Style */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-secondary uppercase font-label-caps tracking-wider flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-primary" /> Transition Effect
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['fade', 'slide', 'zoom', 'flip'] as TransitionType[]).map((t) => (
              <Button 
                type="button"
                key={t} 
                variant={settings.transition === t ? "default" : "outline"}
                className={`capitalize h-10 text-xs rounded-xl ${settings.transition === t ? 'bg-primary hover:bg-primary-container text-white border-primary' : 'border-outline-variant/25 bg-surface-container-low text-secondary hover:border-primary/40'}`}
                onClick={() => update('transition', t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Playback speed */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-secondary uppercase font-label-caps tracking-wider flex items-center gap-1.5">
            <FastForward className="w-3.5 h-3.5 text-primary" /> Speed Control
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'normal', 'fast'] as SpeedType[]).map((s) => (
              <Button 
                type="button"
                key={s} 
                variant={settings.speed === s ? "default" : "outline"}
                className={`capitalize h-10 text-xs rounded-xl ${settings.speed === s ? 'bg-primary hover:bg-primary-container text-white border-primary' : 'border-outline-variant/25 bg-surface-container-low text-secondary hover:border-primary/40'}`}
                onClick={() => update('speed', s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* AI Narration check */}
        <div className="flex items-center justify-between bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-on-surface">AI Voice Narration</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={aiNarration}
              onChange={(e) => setAiNarration(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
        
      </CardContent>

      <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low/40 flex gap-2 sticky bottom-0">
         <Button variant="ghost" onClick={onClose} className="flex-1 rounded-full h-11 text-xs">Close</Button>
         <Button onClick={onPlay} className="flex-1 bg-primary hover:bg-primary-container text-white rounded-full h-11 text-xs font-semibold shadow-md shadow-primary/10">
           <Play className="w-3.5 h-3.5 mr-1 text-white fill-white" /> Play Reel
         </Button>
      </div>
    </Card>
  );
}
