import { useState } from "react";
import { Sparkles, Image as ImageIcon, Wind, Music, Play, FastForward, Settings2 } from "lucide-react";
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
    <Card className="w-full max-w-sm h-full max-h-[80vh] overflow-y-auto bg-zinc-950 border-white/10 flex flex-col">
      <CardHeader className="border-b border-white/5 pb-4 sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-400" />
            Customization Studio
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6 flex-1">
        
        {/* Speed */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <FastForward className="w-4 h-4" /> Playback Speed
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'normal', 'fast'] as SpeedType[]).map((s) => (
              <Button 
                key={s} 
                variant={settings.speed === s ? "default" : "outline"}
                className={`capitalize ${settings.speed === s ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}`}
                onClick={() => update('speed', s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Transition */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Wind className="w-4 h-4" /> Transition Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['fade', 'slide', 'zoom', 'flip'] as TransitionType[]).map((t) => (
              <Button 
                key={t} 
                variant={settings.transition === t ? "default" : "outline"}
                className={`capitalize ${settings.transition === t ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}`}
                onClick={() => update('transition', t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Background Effect
          </label>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant={settings.background === 'solid' ? "default" : "outline"}
              className={`justify-start ${settings.background === 'solid' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}`}
              onClick={() => update('background', 'solid')}
            >
              Solid Black
            </Button>
            <Button 
              variant={settings.background === 'gradient' ? "default" : "outline"}
              className={`justify-start ${settings.background === 'gradient' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}`}
              onClick={() => update('background', 'gradient')}
            >
              Neon Gradient
            </Button>
            <Button 
              variant={settings.background === 'blur' ? "default" : "outline"}
              className={`justify-start ${settings.background === 'blur' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/10 hover:bg-white/5'}`}
              onClick={() => update('background', 'blur')}
            >
              Glassmorphism (Blurred Photo)
            </Button>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Pre-built Vibes
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="border-white/10 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/50"
              onClick={() => onChange({ template: 'vintage', transition: 'fade', background: 'solid', speed: 'normal', musicUrl: null })}
            >
              Vintage Film
            </Button>
            <Button 
              variant="outline"
              className="border-white/10 hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/50"
              onClick={() => onChange({ template: 'party', transition: 'zoom', background: 'gradient', speed: 'fast', musicUrl: null })}
            >
              Neon Party
            </Button>
          </div>
        </div>
        
      </CardContent>

      <div className="p-4 border-t border-white/5 bg-zinc-900/50 sticky bottom-0 flex gap-2">
         <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
         <Button onClick={onPlay} className="flex-1 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20">
           <Play className="w-4 h-4 mr-2" /> Play Reel
         </Button>
      </div>
    </Card>
  );
}
