
import { Note, Theme, TimerPreset } from './types';

const getPentagonPos = (index: number, isInverted: boolean, radius: number = 38) => {
  const startAngle = isInverted ? 90 : -90;
  const angle = startAngle + (index * (360 / 5));
  const rad = angle * (Math.PI / 180);
  return {
    left: 50 + radius * Math.cos(rad),
    top: 50 + radius * Math.sin(rad)
  };
};

// 日本の伝統的な5音階（陽旋法/律音階ベース）に近い構成
const leftDrumNotes = [
  { id: 'n_b3', name: 'B3', frequency: 246.94, label: 'B3', index: 0 },
  { id: 'n_g3', name: 'G3', frequency: 196.00, label: 'G3', index: 1 },
  { id: 'n_d3', name: 'D3', frequency: 146.83, label: 'D3', index: 2 },
  { id: 'n_e3', name: 'E3', frequency: 164.81, label: 'E3', index: 3 },
  { id: 'n_a3', name: 'A3', frequency: 220.00, label: 'A3', index: 4 },
];

const rightDrumNotes = [
  { id: 'n_d4', name: 'D4', frequency: 293.66, label: 'D4', index: 0 },
  { id: 'n_e4', name: 'E4', frequency: 329.63, label: 'E4', index: 1 },
  { id: 'n_a4', name: 'A4', frequency: 440.00, label: 'A4', index: 2 },
  { id: 'n_b4', name: 'B4', frequency: 493.88, label: 'B4', index: 3 },
  { id: 'n_g4', name: 'G4', frequency: 392.00, label: 'G4', index: 4 },
];

export const NOTES: Note[] = [
  ...leftDrumNotes.map(n => ({
    ...n,
    drumIndex: 0 as const,
    ...getPentagonPos(n.index, false),
    cloudLeft: 15 + (n.index * 5)
  })),
  ...rightDrumNotes.map(n => ({
    ...n,
    drumIndex: 1 as const,
    ...getPentagonPos(n.index, true),
    cloudLeft: 65 + (n.index * 5)
  }))
];

export const THEMES: Theme[] = [
  {
    id: 'sakura_day',
    name: '春の庭 (Spring Garden)',
    bgGradient: 'from-stone-950 via-pink-950/20 to-stone-900',
    bgImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(255, 241, 242, 0.08)',
    rainColor: 'rgba(254, 202, 202, 0.8)',
    accentColor: '#f9a8d4',
    particleColor: '#fbcfe8',
    overlayColor: 'rgba(0, 0, 0, 0.2)',
    isPremium: false
  },
  {
    id: 'night_garden',
    name: '夜の庭 (Night Garden)',
    bgGradient: 'from-slate-950 via-indigo-950/40 to-stone-950',
    bgImage: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(30, 27, 75, 0.3)',
    rainColor: 'rgba(165, 180, 252, 0.5)',
    accentColor: '#818cf8',
    particleColor: '#fef9c3',
    overlayColor: 'rgba(0, 0, 0, 0.4)',
    isPremium: true
  },
  {
    id: 'old_capital',
    name: '古都 (Old Capital)',
    bgGradient: 'from-stone-950 via-orange-950/20 to-stone-900',
    bgImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(66, 32, 6, 0.25)', 
    rainColor: 'rgba(254, 202, 202, 0.65)',
    accentColor: '#fb923c', 
    particleColor: '#fdba74',
    overlayColor: 'rgba(0, 0, 0, 0.2)',
    isPremium: true
  },
  {
    id: 'tsumugi',
    name: 'つむぎ糸 (Tsumugi-ito)',
    bgGradient: 'from-stone-800 via-stone-700/30 to-stone-900',
    bgImage: 'https://images.unsplash.com/photo-1542044801-30d3e45ae49a?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(87, 83, 78, 0.25)',
    rainColor: 'rgba(214, 211, 209, 0.6)',
    accentColor: '#a8a29e',
    particleColor: '#d6d3d1',
    overlayColor: 'rgba(0, 0, 0, 0.15)',
    isPremium: false
  }
];

export const SHISHIODOSHI_PRESETS: TimerPreset[] = [
  { label: '煎茶 (Sencha)', minutes: 1, icon: '🍵', isPremium: false },
  { label: '紅茶 (Black Tea)', minutes: 3, icon: '🫖', isPremium: false },
  { label: '瞑想 (Meditation)', minutes: 15, icon: '🧘', isPremium: false },
  { label: '読書 (Reading)', minutes: 30, icon: '📖', isPremium: true },
  { label: 'うたた寝 (Nap)', minutes: 60, icon: '💤', isPremium: true },
];

export const GRAVITY_SPEED = 12; 
export const PAD_Y_PERCENT = 52;
