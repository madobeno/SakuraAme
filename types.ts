
export interface Note {
  id: string;
  name: string;
  frequency: number;
  label: string;
  left: number; // Percentage
  top: number; // Percentage
  cloudLeft: number; // Where rain falls from
  drumIndex: 0 | 1; // 0 = Left Drum, 1 = Right Drum
}

export interface RainDrop {
  id: string;
  noteId: string;
  x: number;
  y: number;
  speed: number;
  targetY: number;
  hasHit: boolean;
  opacity: number;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}

export interface NoteParticle {
  id: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  velocity: { x: number, y: number };
  color: string;
  size: number;
}

export type AmbienceType = 'rain' | 'wind' | 'birds' | 'river' | 'crickets' | 'windChime' | 'honeybee' | 'thunder' | 'suikinkutsu';

export interface AmbienceConfig {
  active: boolean;
  volume: number;
  isPremium?: boolean;
}

export type AmbienceLayer = 'base' | 'middle' | 'accent';

export interface AmbienceLayerConfig {
  active: boolean;
  volume: number;
}

export interface AmbienceMixerConfig {
  base: AmbienceLayerConfig;
  middle: AmbienceLayerConfig;
  accent: AmbienceLayerConfig;
}

export type SoundType = 'Crystal' | 'MusicBox' | 'Ether' | 'Deep' | 'Bamboo' | 'Suikin';

export interface Theme {
  id: string;
  name: string;
  bgGradient: string;
  bgImage: string;
  drumColor: string;
  rainColor: string;
  accentColor: string;
  particleColor: string;
  overlayColor?: string;
  isPremium?: boolean;
}

export type TimerPreset = {
  label: string;
  minutes: number;
  icon: string; // Emoji char
  isPremium?: boolean;
};
