
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sliders, 
  Settings, 
  Hourglass, 
  X,
  Sparkles,
  Music,
  Bird,
  Wind,
  Waves,
  Bug,
  Bell,
  Lock,
  Crown,
  Play,
  Pause,
  CloudRain,
  CloudSun,
  Wind as WindIcon,
  CloudLightning,
  Droplets,
  Circle
} from 'lucide-react';
import { 
  Note, 
  RainDrop, 
  Ripple, 
  AmbienceType, 
  AmbienceConfig, 
  AmbienceLayer,
  AmbienceMixerConfig,
  Theme, 
  NoteParticle,
  SoundType
} from './types';
import { 
  NOTES, 
  THEMES, 
  GRAVITY_SPEED, 
  PAD_Y_PERCENT, 
  SHISHIODOSHI_PRESETS 
} from './constants';
import { audioEngine } from './services/audioEngine';
import SakuraVisualizer from './components/SakuraVisualizer';
import PresetAnimations from './components/PresetAnimations';

interface SongStep {
    noteId: string;
    delay: number;
}

const SONGS: Record<string, { name: string, steps: SongStep[], isPremium?: boolean }> = {
    sakura: {
        name: 'さくらさくら',
        steps: [
            { noteId: 'n_a3', delay: 800 }, { noteId: 'n_a3', delay: 800 }, { noteId: 'n_b3', delay: 1600 },
            { noteId: 'n_a3', delay: 800 }, { noteId: 'n_a3', delay: 800 }, { noteId: 'n_b3', delay: 1600 },
            { noteId: 'n_a3', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_d4', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_a3', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_a3', delay: 800 },
            { noteId: 'n_g3', delay: 800 }, { noteId: 'n_e3', delay: 800 }, { noteId: 'n_d3', delay: 1600 },
        ]
    },
    haru: {
        name: '春の調べ',
        isPremium: true,
        steps: [
            { noteId: 'n_d3', delay: 300 }, { noteId: 'n_e3', delay: 300 }, { noteId: 'n_g3', delay: 300 }, { noteId: 'n_a3', delay: 300 }, { noteId: 'n_b3', delay: 600 },
            { noteId: 'n_d4', delay: 300 }, { noteId: 'n_b3', delay: 300 }, { noteId: 'n_a3', delay: 300 }, { noteId: 'n_g3', delay: 300 }, { noteId: 'n_e3', delay: 600 },
            { noteId: 'n_g4', delay: 400 }, { noteId: 'n_a4', delay: 400 }, { noteId: 'n_b4', delay: 800 },
            { noteId: 'n_a4', delay: 400 }, { noteId: 'n_g4', delay: 400 }, { noteId: 'n_e4', delay: 800 },
        ]
    },
    tsuki: {
        name: '月夜の川',
        isPremium: true,
        steps: [
            { noteId: 'n_d3', delay: 1200 }, { noteId: 'n_a3', delay: 1200 }, { noteId: 'n_d4', delay: 2400 },
            { noteId: 'n_e3', delay: 1200 }, { noteId: 'n_b3', delay: 1200 }, { noteId: 'n_e4', delay: 2400 },
            { noteId: 'n_g3', delay: 1200 }, { noteId: 'n_d4', delay: 1200 }, { noteId: 'n_g4', delay: 2400 },
        ]
    },
    fubuki: {
        name: '花吹雪',
        isPremium: true,
        steps: [
            { noteId: 'n_a4', delay: 200 }, { noteId: 'n_b4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
            { noteId: 'n_a4', delay: 200 }, { noteId: 'n_b4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
            { noteId: 'n_g4', delay: 200 }, { noteId: 'n_e4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
            { noteId: 'n_g3', delay: 200 }, { noteId: 'n_a3', delay: 200 }, { noteId: 'n_d3', delay: 800 },
        ]
    }
};

interface SoundPreset {
    name: string;
    density: number;
    icon: React.ReactNode;
    ambience: Partial<Record<AmbienceType, boolean>>;
    isPremium?: boolean;
}

const SOUND_PRESETS: Record<string, SoundPreset> = {
    fox: { 
        name: '狐の嫁入り', 
        density: 0.15, 
        icon: <CloudSun size={14} />,
        ambience: { rain: true, birds: true, river: true, honeybee: true, wind: false, windChime: false, crickets: false, thunder: false, suikinkutsu: false },
        isPremium: false
    },
    shower: { 
        name: '花時雨', 
        density: 0.4, 
        icon: <CloudRain size={14} />,
        ambience: { rain: true, wind: true, crickets: true, suikinkutsu: true, birds: false, river: false, honeybee: false, windChime: false, thunder: false },
        isPremium: false
    },
    scatter: { 
        name: '花散らし', 
        density: 0.6, 
        icon: <WindIcon size={14} />,
        ambience: { rain: true, wind: true, birds: true, suikinkutsu: true, river: false, honeybee: false, crickets: false, windChime: false, thunder: false },
        isPremium: true
    },
    storm: { 
        name: '春の嵐', 
        density: 0.9, 
        icon: <CloudLightning size={14} />,
        ambience: { rain: true, wind: true, windChime: true, thunder: true, birds: false, river: false, honeybee: false, crickets: false, suikinkutsu: false },
        isPremium: true
    }
};

const SOUND_LABELS: Record<SoundType, string> = {
  Suikin: '水琴',
  Bamboo: '竹',
  Crystal: '水晶',
  MusicBox: 'オルゴール',
  Ether: '空',
  Deep: '深響'
};

const App: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hasStarted, setHasStarted] = useState(false);
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles, setParticles] = useState<NoteParticle[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const [showMixer, setShowMixer] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showInstruments, setShowInstruments] = useState(false);
  const [showEisho, setShowEisho] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('sakura_ame_premium') === 'true';
  });

  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [currentSoundType, setCurrentSoundType] = useState<SoundType>('Suikin');
  const currentSoundTypeRef = useRef<SoundType>('Suikin'); 
  
  const [timerTotal, setTimerTotal] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isShishiodoshiTilting, setIsShishiodoshiTilting] = useState(false);

  // Eisho Mode (Auto Play) States
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentSongKey, setCurrentSongKey] = useState<string>('sakura');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const autoPlayTimeoutRef = useRef<number | null>(null);

  const [ambience, setAmbience] = useState<Record<AmbienceType, AmbienceConfig>>({
      rain: { active: true, volume: 0.3 }, 
      wind: { active: false, volume: 0.3 },
      birds: { active: false, volume: 0.3 },
      river: { active: false, volume: 0.4 },
      crickets: { active: false, volume: 0.2 },
      windChime: { active: false, volume: 0.2, isPremium: true },
      honeybee: { active: false, volume: 0.4, isPremium: true }, 
      thunder: { active: false, volume: 0.3, isPremium: true }, 
      suikinkutsu: { active: false, volume: 0.4, isPremium: true },
      mejiro: { active: false, volume: 0.3 },
      frog: { active: false, volume: 0.3 },
  });

  // 環境音ミキサー（3レイヤー）
  const [ambienceMixer, setAmbienceMixer] = useState<AmbienceMixerConfig>({
      base: { active: true, volume: 0.4 },
      middle: { active: true, volume: 0.5 },
      accent: { active: true, volume: 0.4 },
  });

  const [rainDensity, setRainDensity] = useState<number>(0.15);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const requestRef = useRef<number>(null);

  useEffect(() => {
    currentSoundTypeRef.current = currentSoundType;
  }, [currentSoundType]);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let interval: number;
    if (timerRemaining !== null && timerRemaining > 0) {
        interval = window.setInterval(() => {
            setTimerRemaining(prev => {
                if (prev === null) return null;
                if (prev === 16) audioEngine.fadeOutMaster(15); 
                if (prev <= 1) {
                    finishTimer();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRemaining]);

  const triggerVisualRipple = (x: number, y: number, color: string, size: number = 20) => {
    setRipples(prev => [...prev, {
        id: Math.random().toString(36),
        x, y, size, opacity: 1.0,
        color
    }]);
  };

  const finishTimer = () => {
      setTimerRemaining(0);
      setDrops([]); 
      setIsAutoPlaying(false);
      setIsShishiodoshiTilting(true);
      setTimeout(() => {
          setIsShishiodoshiTilting(false); 
          audioEngine.playShishiodoshi(); 
          audioEngine.playTempleBell();  
          triggerVisualRipple(dimensions.width / 2, dimensions.height / 2, '#fff', 300);
      }, 1500); 
      
      setTimeout(() => {
          setIsTimerFinished(true);
          setTimerTotal(null);
          setTimerRemaining(null);
      }, 15000); 
  };

  const startExperience = async () => {
    audioEngine.init();
    await audioEngine.resume();
    
    // 新しい3レイヤーシステムで初期化
    audioEngine.setAmbienceLayer('base', ambienceMixer.base.active, ambienceMixer.base.volume);
    audioEngine.setAmbienceLayer('middle', ambienceMixer.middle.active, ambienceMixer.middle.volume);
    audioEngine.setAmbienceLayer('accent', ambienceMixer.accent.active, ambienceMixer.accent.volume, 'normal');
    
    audioEngine.setMasterVolume(masterVolume);
    setHasStarted(true);
  };

  const handleInteraction = useCallback(async () => {
    await audioEngine.resume();
  }, []);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMasterVolume(nextMute ? 0 : masterVolume);
  };

  const toggleAmbience = (type: AmbienceType) => {
    if (ambience[type].isPremium && !isPremium) {
        setShowPremiumModal(true);
        closePopups();
        return;
    }
    const nextActive = !ambience[type].active;
    const nextAmbience = {
      ...ambience,
      [type]: { ...ambience[type], active: nextActive }
    };
    setAmbience(nextAmbience);
    audioEngine.setAmbience(type, nextActive, ambience[type].volume);
  };

  const setAmbienceLayerVolume = (layer: AmbienceLayer, volume: number) => {
    const newMixer = {
      ...ambienceMixer,
      [layer]: { ...ambienceMixer[layer], volume }
    };
    setAmbienceMixer(newMixer);
    audioEngine.setAmbienceLayer(layer, newMixer[layer].active, volume, layer === 'accent' ? 'normal' : undefined);
  };

  const toggleAmbienceLayer = (layer: AmbienceLayer) => {
    const newMixer = {
      ...ambienceMixer,
      [layer]: { ...ambienceMixer[layer], active: !ambienceMixer[layer].active }
    };
    setAmbienceMixer(newMixer);
    audioEngine.setAmbienceLayer(layer, newMixer[layer].active, newMixer[layer].volume, layer === 'accent' ? 'normal' : undefined);
  };

  const applySoundPreset = (key: string) => {
      const preset = SOUND_PRESETS[key];
      if (!preset) return;

      // 新しい3レイヤーシステムに対応
      const newMixer: AmbienceMixerConfig = { ...ambienceMixer };
      
      // プリセットに応じてレイヤーを調整
      if (preset.ambience.rain) {
          if (key === 'fox') {
              // 狐の嫁入り: 遠くの雨90%、軒先の雨10%（前回の設定を維持）
              newMixer.base.active = true;
              newMixer.base.volume = 0.9;
              newMixer.middle.active = true;
              newMixer.middle.volume = 0.1;
          } else if (key === 'shower') {
              // 花時雨: 遠くの雨70%、軒先の雨30%
              newMixer.base.active = true;
              newMixer.base.volume = 0.7;
              newMixer.middle.active = true;
              newMixer.middle.volume = 0.3;
          } else if (key === 'scatter') {
              // 花散らし: 遠くの雨50%、軒先の雨50%
              newMixer.base.active = true;
              newMixer.base.volume = 0.5;
              newMixer.middle.active = true;
              newMixer.middle.volume = 0.5;
          } else if (key === 'storm') {
              // 春の嵐: 遠くの雨80%、軒先の雨90%
              newMixer.base.active = true;
              newMixer.base.volume = 0.8;
              newMixer.middle.active = true;
              newMixer.middle.volume = 0.9;
          } else {
              // その他のプリセットはデフォルトバランス
              newMixer.base.active = true;
              newMixer.base.volume = 0.4;
              newMixer.middle.active = true;
              newMixer.middle.volume = 0.5;
          }
      } else {
          newMixer.base.active = false;
          newMixer.middle.active = false;
      }
      
      // アクセント音の設定
      // 狐の嫁入り: 鶯、せせらぎ、蜜蜂
      // 花時雨: 弱い春風、鈴虫、水琴窟
      // 花散らし: 鶯、春風、水琴窟
      // 春の嵐: 強い春風、風鈴、遠雷
      const hasAccent = preset.ambience.birds || preset.ambience.wind || preset.ambience.windChime || preset.ambience.suikinkutsu || preset.ambience.crickets || preset.ambience.thunder || preset.ambience.river || preset.ambience.honeybee;
      newMixer.accent.active = hasAccent;
      if (hasAccent) {
          // 春の嵐は強いので音量上げる
          newMixer.accent.volume = key === 'storm' ? 0.6 : (key === 'shower' ? 0.35 : 0.4);
      }
      
      setAmbienceMixer(newMixer);
      
      // エンジンに適用（風の強さも設定）
      audioEngine.setAmbienceLayer('base', newMixer.base.active, newMixer.base.volume);
      audioEngine.setAmbienceLayer('middle', newMixer.middle.active, newMixer.middle.volume);
      
      // プリセットに応じた風の強さを設定
      let windStrength: 'weak' | 'strong' | 'normal' = 'normal';
      if (key === 'shower') {
          windStrength = 'weak'; // 花時雨: 弱い春風
      } else if (key === 'storm') {
          windStrength = 'strong'; // 春の嵐: 強い春風
      }
      audioEngine.setAmbienceLayer('accent', newMixer.accent.active, newMixer.accent.volume, windStrength);
      
      // 後方互換性のため、古いambienceも更新
      const newAmbience = { ...ambience };
      (Object.keys(newAmbience) as AmbienceType[]).forEach(type => {
          const isActive = preset.ambience[type] ?? false;
          if (newAmbience[type].isPremium && !isPremium && isActive) {
              newAmbience[type].active = false;
          } else {
              newAmbience[type].active = isActive;
          }
      });
      setAmbience(newAmbience);
      setRainDensity(preset.density);
      setActivePreset(key); // アニメーションを開始
      triggerVisualRipple(dimensions.width / 2, dimensions.height - 100, currentTheme.accentColor, 100);
      
      // 5秒後にアニメーションをフェードアウト（継続表示する場合は削除）
      // setTimeout(() => setActivePreset(null), 5000);
  };

  const selectTheme = (theme: Theme) => {
      if (theme.isPremium && !isPremium) {
          setShowPremiumModal(true);
          closePopups();
          return;
      }
      setCurrentTheme(theme);
      closePopups();
  };

  const handlePurchase = () => {
      setIsPremium(true);
      localStorage.setItem('sakura_ame_premium', 'true');
      setShowPremiumModal(false);
      triggerVisualRipple(dimensions.width/2, dimensions.height/2, '#FFD700', 300);
  };

  const handleHit = useCallback((noteId: string, x: number, y: number) => {
    const note = NOTES.find(n => n.id === noteId);
    if (note && !isMuted) {
      audioEngine.playTone(note.frequency, currentSoundTypeRef.current);
      
      const burst: NoteParticle[] = [];
      const pCount = 6;
      const particleColor = currentTheme.particleColor;
      const accentColor = currentTheme.accentColor;
      for (let i = 0; i < pCount; i++) {
        burst.push({
          id: Math.random().toString(36),
          x: x,
          y: y,
          rotation: Math.random() * Math.PI * 2,
          opacity: 1,
          velocity: {
              x: (Math.random() - 0.5) * 4,
              y: -1.5 - Math.random() * 2
          },
          color: particleColor,
          size: 6 + Math.random() * 8
        });
      }
      setParticles(prev => [...prev, ...burst]);
      triggerVisualRipple(x, y, accentColor, 10);
    } else if (!isMuted) {
      triggerVisualRipple(x, y, currentTheme.accentColor, 10);
    }
  }, [isMuted, currentTheme.particleColor, currentTheme.accentColor]); 

  const spawnDrop = (noteId: string) => {
    if (isTimerFinished || document.hidden) return;
    setActiveNote(noteId);
    setTimeout(() => setActiveNote(null), 300); 
    const note = NOTES.find(n => n.id === noteId);
    if (!note) return;
    const startX = (dimensions.width * note.cloudLeft) / 100 + (Math.random() * 40 - 20);
    const targetY = (dimensions.height * PAD_Y_PERCENT) / 100;
    setDrops(prev => [...prev, {
      id: Math.random().toString(36),
      noteId: note.id,
      x: startX,
      y: -50,
      speed: GRAVITY_SPEED + (Math.random() * 4),
      targetY: targetY,
      hasHit: false,
      opacity: 0.6 + Math.random() * 0.4
    }]);
  };

  useEffect(() => {
    if (!isAutoPlaying || isTimerFinished) {
        if (autoPlayTimeoutRef.current) {
            window.clearTimeout(autoPlayTimeoutRef.current);
            autoPlayTimeoutRef.current = null;
        }
        return;
    }
    const song = SONGS[currentSongKey];
    const step = song.steps[currentStepIndex];
    if (!document.hidden) {
      spawnDrop(step.noteId);
    }
    autoPlayTimeoutRef.current = window.setTimeout(() => {
        if (isAutoPlaying) {
            setCurrentStepIndex(prev => (prev + 1) % song.steps.length);
        }
    }, step.delay);
    return () => {
        if (autoPlayTimeoutRef.current) {
            window.clearTimeout(autoPlayTimeoutRef.current);
        }
    };
  }, [isAutoPlaying, currentSongKey, currentStepIndex, isTimerFinished, dimensions.width, dimensions.height]);

  const animate = (time: number) => {
    if (isTimerFinished || document.hidden) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    setDrops(prevDrops => {
      const nextDrops: RainDrop[] = [];
      prevDrops.forEach(drop => {
        const newY = drop.y + drop.speed;
        if (!drop.hasHit && newY >= drop.targetY) {
          handleHit(drop.noteId, drop.x, drop.targetY);
        } else if (!drop.hasHit && newY < dimensions.height) {
          nextDrops.push({ ...drop, y: newY });
        }
      });
      return nextDrops;
    });
    setRipples(prevRipples => prevRipples.map(r => ({
        ...r, size: r.size + (r.size > 50 ? 1.5 : 1.2), 
        opacity: r.opacity - 0.006
    })).filter(r => r.opacity > 0));
    setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.velocity.x,
        y: p.y + p.velocity.y + 0.15,
        rotation: p.rotation + 0.02,
        opacity: p.opacity - 0.009
    })).filter(p => p.opacity > 0));
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (hasStarted) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => { 
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [hasStarted, animate]);

  useEffect(() => {
    if (!hasStarted || isTimerFinished || rainDensity === 0 || isAutoPlaying) return;
    const intervalTime = Math.max(250, 2200 - (rainDensity * 1800)); 
    const timer = setInterval(() => {
      if (document.hidden) return;
      const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)];
      spawnDrop(randomNote.id);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [hasStarted, isTimerFinished, rainDensity, isAutoPlaying, dimensions.width, dimensions.height]);

  const closePopups = () => {
      setShowMixer(false);
      setShowThemes(false);
      setShowTimer(false);
      setShowInstruments(false);
      setShowEisho(false);
      setShowPremiumModal(false);
  };

  const resetExperience = () => {
      setIsTimerFinished(false);
      setTimerRemaining(null);
      setTimerTotal(null);
      setIsAutoPlaying(false);
      audioEngine.setMasterVolume(masterVolume);
      setDrops([]);
      setParticles([]);
      setRipples([]);
  };

  const handleMainPlayButton = () => {
      if (isAutoPlaying) {
          setIsAutoPlaying(false);
      } else {
          closePopups();
          setShowEisho(!showEisho);
      }
  };

  const selectSong = (key: string) => {
      const song = SONGS[key];
      if (song.isPremium && !isPremium) {
          setShowPremiumModal(true);
          closePopups();
          return;
      }
      setCurrentSongKey(key);
      setCurrentStepIndex(0);
      setIsAutoPlaying(true);
      setShowEisho(false); 
  };

  const selectInstrument = (type: SoundType) => {
      // Made 'MusicBox' free as requested
      const premiumInstruments: SoundType[] = ['Crystal', 'Ether', 'Deep'];
      if (premiumInstruments.includes(type) && !isPremium) {
          setShowPremiumModal(true);
          closePopups();
          return;
      }
      setCurrentSoundType(type);
      closePopups();
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-stone-950 text-sakura-100 relative overflow-hidden" onClick={startExperience}>
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2000&q=80" className="w-full h-full object-cover scale-110 blur-[2px]" alt="Spring Garden" />
        </div>
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="z-10 text-center space-y-8 p-12 max-w-lg bg-stone-950/20 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] mx-4 animate-ripple-in">
          <h1 className="text-8xl font-serif tracking-[0.4em] text-white mb-2 drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)]">桜雨</h1>
          <h2 className="text-xl font-light tracking-[0.3em] text-sakura-100/90 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">Sakura Ame</h2>
          <div className="w-24 h-[1.5px] bg-white/40 mx-auto my-6 shadow-2xl"></div>
          <p className="text-sm font-serif text-white/80 italic drop-shadow-lg tracking-widest">Zen Healing Experience.</p>
          <div className="mt-8 p-4 px-14 border border-white/30 bg-white/5 rounded-full text-xs text-white hover:bg-white/10 hover:border-white/50 transition-all cursor-pointer backdrop-blur-md shadow-2xl font-bold tracking-[0.4em] uppercase">Start Experience</div>
        </div>
      </div>
    );
  }

  const isMobile = dimensions.width < 768;
  const drumSize = isMobile ? Math.min(dimensions.width * 0.4, dimensions.height * 0.3) : Math.min(dimensions.width * 0.4, dimensions.height * 0.35);

  return (
    <div className={`relative h-screen w-full bg-stone-950 overflow-hidden font-serif select-none transition-colors duration-1000`} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {THEMES.map((theme) => (
          <div key={theme.id} className={`absolute inset-0 transition-opacity duration-[1500ms] pointer-events-none ${currentTheme.id === theme.id ? 'opacity-100' : 'opacity-0'}`}>
            <img src={theme.bgImage} className="w-full h-full object-cover scale-[1.02]" alt={theme.name} loading="eager" />
            <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} mix-blend-multiply opacity-80`}></div>
            <div className="absolute inset-0" style={{ backgroundColor: theme.overlayColor }}></div>
          </div>
        ))}
      </div>
      <SakuraVisualizer drops={drops} ripples={ripples} particles={particles} width={dimensions.width} height={dimensions.height} theme={currentTheme} />
      <PresetAnimations presetKey={activePreset} width={dimensions.width} height={dimensions.height} />
      {isTimerFinished && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg animate-in fade-in duration-1000">
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                  <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out"></div>
                  <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out delay-700"></div>
                  <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out delay-1000"></div>
              </div>
              <div className="text-center space-y-6 relative z-10">
                  <h2 className="text-6xl text-white font-serif tracking-[0.6em] drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-pulse">静寂</h2>
                  <p className="text-stone-400 tracking-widest text-xs uppercase">Silence dwells within the ripple.</p>
                  <button onClick={resetExperience} className="mt-12 px-12 py-4 border border-white/20 rounded-full text-white hover:text-white hover:border-white hover:bg-white/5 transition-all text-[10px] uppercase tracking-[0.3em] bg-white/5 backdrop-blur-md shadow-3xl">Return to Garden</button>
              </div>
          </div>
      )}
      <div className={`absolute ${isMobile ? 'top-4 right-4' : 'top-8 right-8'} z-40 flex flex-col gap-3`}>
          <div className={`bg-black/5 backdrop-blur-3xl ${isMobile ? 'p-1.5' : 'p-2'} rounded-full border border-white/10 flex flex-col items-center ${isMobile ? 'gap-2' : 'gap-3'} transition-all active:bg-black/15 shadow-2xl`}>
            <button onClick={toggleMute} className={`${isMobile ? 'p-2.5' : 'p-3'} rounded-full transition-all drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] active:scale-95 ${isMuted ? 'text-red-400' : 'text-white'}`}>{isMuted ? <VolumeX size={isMobile ? 20 : 22} /> : <Volume2 size={isMobile ? 20 : 22} />}</button>
            <div className={`${isMobile ? 'w-6' : 'w-8'} h-[1px] bg-white/10`}></div>
            <button onClick={() => { closePopups(); setShowTimer(!showTimer); }} className={`${isMobile ? 'p-2.5' : 'p-3'} rounded-full transition-all drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] active:scale-95 ${timerRemaining !== null ? 'text-sakura-300 scale-110' : 'text-white'}`}><Hourglass size={isMobile ? 20 : 22} /></button>
          </div>
      </div>
      <div className={`absolute ${isMobile ? 'bottom-4 left-4' : 'bottom-12 left-8'} z-40 flex flex-col ${isMobile ? 'gap-3' : 'gap-5'}`}>
          <button onClick={() => { closePopups(); setShowThemes(!showThemes); }} className={`${isMobile ? 'p-4' : 'p-5'} rounded-full border transition-all backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] active:scale-95 ${showThemes ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white active:bg-black/15'}`}><Settings size={isMobile ? 22 : 24} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" /></button>
          <button onClick={() => { closePopups(); setShowMixer(!showMixer); }} className={`${isMobile ? 'p-4' : 'p-5'} rounded-full border transition-all backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] active:scale-95 ${showMixer ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white active:bg-black/15'}`}><Sliders size={isMobile ? 22 : 24} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" /></button>
          <button onClick={() => { closePopups(); setShowInstruments(!showInstruments); }} className={`${isMobile ? 'p-4' : 'p-5'} rounded-full border transition-all backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] active:scale-95 ${showInstruments ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white active:bg-black/15'}`}><Music size={isMobile ? 22 : 24} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" /></button>
      </div>
      <div className={`absolute ${isMobile ? 'bottom-4 right-4' : 'bottom-12 right-8'} z-40 flex flex-col items-end ${isMobile ? 'gap-3' : 'gap-5'}`}>
          {showEisho && (
              <div className={`${isMobile ? 'mb-2 max-h-[calc(100vh-8rem)] overflow-y-auto' : 'mb-2'} bg-stone-950/20 backdrop-blur-3xl border border-white/10 rounded-3xl ${isMobile ? 'p-4 w-48' : 'p-6 w-56'} animate-in ${isMobile ? 'slide-in-from-bottom-4' : 'slide-in-from-right-4'} shadow-[0_15px_35px_rgba(0,0,0,0.5)]`}>
                  <div className={`flex justify-between items-center ${isMobile ? 'mb-4 pb-3' : 'mb-6 pb-4'} border-b border-white/10`}>
                      <h3 className={`text-white font-serif ${isMobile ? 'text-[9px]' : 'text-[10px]'} tracking-[0.3em] uppercase font-bold`}>詠唱選択</h3>
                      <button onClick={closePopups} className="text-white/50 active:text-white transition-colors"><X size={isMobile ? 14 : 16} /></button>
                  </div>
                  <div className={`${isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
                      {Object.entries(SONGS).map(([key, song]) => (
                          <button key={key} onClick={() => selectSong(key)} className={`w-full flex justify-between items-center ${isMobile ? 'px-3 py-2.5' : 'px-4 py-3'} rounded-xl ${isMobile ? 'text-[9px]' : 'text-[10px]'} tracking-widest uppercase transition-all active:scale-95 ${currentSongKey === key && isAutoPlaying ? 'bg-sakura-500/40 text-sakura-100 border border-sakura-300/30' : 'text-white/60 active:text-white active:bg-white/5'}`}>
                              <span className="flex items-center gap-2">
                                {song.name}
                                {song.isPremium && !isPremium && <Lock size={isMobile ? 10 : 12} className="text-amber-400" />}
                              </span>
                          </button>
                      ))}
                  </div>
              </div>
          )}
          <button onClick={handleMainPlayButton} className={`${isMobile ? 'p-4' : 'p-5'} rounded-full border transition-all backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] active:scale-95 ${isAutoPlaying ? 'bg-sakura-500/30 border-sakura-400 text-sakura-100 shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-pulse' : 'bg-black/5 border-white/10 text-white active:bg-black/15'}`}>{isAutoPlaying ? <Pause size={isMobile ? 22 : 24} /> : <Play size={isMobile ? 22 : 24} />}</button>
      </div>
      {!isPremium && (
          <div className={`absolute ${isMobile ? 'top-4 left-4' : 'top-8 left-8'} z-40`}>
              <button onClick={() => setShowPremiumModal(true)} className={`flex items-center gap-2 ${isMobile ? 'px-4 py-1.5 text-[10px]' : 'px-6 py-2 text-xs'} bg-gradient-to-r from-amber-200/20 to-yellow-500/20 backdrop-blur-md rounded-full border border-yellow-500/30 text-yellow-200 font-bold tracking-widest uppercase active:bg-yellow-500/30 transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] animate-pulse-slow active:scale-95`}><Crown size={isMobile ? 12 : 14} /><span>Full Version</span></button>
          </div>
      )}
      {timerRemaining !== null && !isTimerFinished && (
          <div className="absolute top-2 sm:top-12 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-2 sm:gap-8 scale-[0.4] sm:scale-100 origin-top transition-transform">
              <div className="relative">
                  <div className={`relative w-14 h-64 transition-transform duration-[1500ms] ease-in-out origin-center ${isShishiodoshiTilting ? 'rotate-[110deg]' : 'rotate-0'}`}>
                      <div className="absolute inset-0 rounded-full border-r border-white/10 border-b border-black/30 shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden bg-gradient-to-r from-emerald-900/40 via-emerald-700/40 to-emerald-950/40 backdrop-blur-2xl">
                          <div className="absolute bottom-0 left-0 w-full bg-sky-400/20 transition-all duration-1000 ease-linear" style={{ height: `${((timerTotal! - timerRemaining) / timerTotal!) * 100}%` }}></div>
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-2 bg-stone-800 rounded-full -z-10"></div>
                  </div>
              </div>
              <div className="flex flex-col items-center mt-4">
                <span className="text-xl font-serif text-white tracking-[0.3em] bg-emerald-950/30 border border-white/10 px-10 py-3 rounded-full shadow-3xl backdrop-blur-3xl">{Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}</span>
              </div>
          </div>
      )}
      <div className="absolute w-full h-full pointer-events-none z-30 animate-wa-float">
         <div className="absolute" style={{ left: '32%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
             <div className="absolute inset-0 rounded-full border border-white/10 backdrop-blur-2xl" style={{ backgroundColor: currentTheme.drumColor }}></div>
             {NOTES.filter(n => n.drumIndex === 0).map((note) => (<DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />))}
         </div>
         <div className="absolute" style={{ left: '68%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
             <div className="absolute inset-0 rounded-full border border-white/10 backdrop-blur-2xl" style={{ backgroundColor: currentTheme.drumColor }}></div>
             {NOTES.filter(n => n.drumIndex === 1).map((note) => (<DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />))}
         </div>
      </div>
      {showTimer && (
          <div className={`absolute ${isMobile ? 'top-20 right-4 left-4' : 'top-24 right-4 sm:right-24'} ${isMobile ? 'w-auto' : 'w-72'} bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl ${isMobile ? 'p-5' : 'p-8'} z-50 animate-in zoom-in-95`}>
              <div className={`flex justify-between items-center ${isMobile ? 'mb-5 pb-3' : 'mb-8 pb-4'} border-b border-white/10`}>
                  <h3 className={`text-white font-serif ${isMobile ? 'text-xs' : 'text-sm'} tracking-[0.3em] uppercase font-bold`}>Zen Meditation</h3>
                  <button onClick={closePopups} className="text-white/50 active:text-white transition-colors"><X size={isMobile ? 18 : 20} /></button>
              </div>
              <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                  {SHISHIODOSHI_PRESETS.map((preset) => (
                      <button key={preset.label} onClick={() => { 
                          if (preset.isPremium && !isPremium) {
                              setShowPremiumModal(true);
                              closePopups();
                              return;
                          }
                          setTimerTotal(preset.minutes * 60); 
                          setTimerRemaining(preset.minutes * 60); 
                          setIsTimerFinished(false); 
                          closePopups(); 
                      }} className={`w-full flex items-center justify-between ${isMobile ? 'p-4' : 'p-5'} rounded-2xl bg-black/40 active:bg-black/60 transition-all shadow-xl active:scale-95`}>
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-serif text-stone-100 flex items-center gap-2`}>
                              {preset.label}
                              {preset.isPremium && !isPremium && <Lock size={isMobile ? 10 : 12} className="text-amber-400" />}
                          </span>
                          <span className={`${isMobile ? 'text-xl' : 'text-2xl'} opacity-60`}>{preset.icon}</span>
                      </button>
                  ))}
              </div>
          </div>
      )}
      {showThemes && (
          <div className={`absolute ${isMobile ? 'bottom-28 left-4 right-4' : 'bottom-36 left-4 sm:left-8'} ${isMobile ? 'w-auto' : 'w-72'} bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl ${isMobile ? 'p-5' : 'p-8'} z-50 animate-in slide-in-from-bottom-4`}>
              <div className={`flex justify-between items-center ${isMobile ? 'mb-5 pb-3' : 'mb-8 pb-4'} border-b border-white/10`}>
                  <h3 className={`text-white font-serif ${isMobile ? 'text-xs' : 'text-sm'} tracking-[0.3em] uppercase font-bold`}>Atmosphere</h3>
                  <button onClick={closePopups} className="text-white/50 active:text-white transition-colors"><X size={isMobile ? 18 : 20} /></button>
              </div>
              <div className={`${isMobile ? 'space-y-1.5' : 'space-y-2'} mt-4`}>
                  {THEMES.map(t => (
                      <button key={t.id} onClick={() => selectTheme(t)} className={`w-full text-left ${isMobile ? 'px-4 py-3 text-[10px]' : 'px-5 py-4 text-xs'} font-serif transition-all flex items-center justify-between active:scale-95 ${currentTheme.id === t.id ? 'bg-sakura-900/50 text-sakura-100' : 'text-stone-100 active:bg-white/10'}`}><span>{t.name}</span>{t.isPremium && !isPremium && <Lock size={isMobile ? 10 : 12} className="text-yellow-400" />}</button>
                  ))}
              </div>
          </div>
      )}
      {showMixer && (
          <div className={`absolute ${isMobile ? 'bottom-28 left-4 right-4' : 'bottom-36 left-4 sm:left-8'} ${isMobile ? 'w-auto' : 'w-96'} bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl ${isMobile ? 'p-5' : 'p-8'} z-50 animate-in slide-in-from-bottom-4 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)]`}>
               <div className={`flex justify-between items-center ${isMobile ? 'mb-5 pb-3' : 'mb-8 pb-4'} border-b border-white/10`}>
                  <h3 className={`text-white font-serif ${isMobile ? 'text-xs' : 'text-sm'} tracking-[0.3em] uppercase font-bold`}>環境音ミキサー</h3>
                  <button onClick={closePopups} className="text-white/50 active:text-white transition-colors"><X size={isMobile ? 18 : 20} /></button>
              </div>
              <div className={`${isMobile ? 'space-y-4' : 'space-y-6'} max-h-[65vh] overflow-y-auto ${isMobile ? 'pr-1' : 'pr-2'} mt-4`}>
                  {/* マスター音量 */}
                  <div className={`${isMobile ? 'space-y-2' : 'space-y-3'} pb-4 border-b border-white/10`}>
                      <div className={`flex justify-between items-center ${isMobile ? 'text-[10px]' : 'text-[11px]'} text-white font-bold uppercase tracking-widest`}>
                          <span className="flex items-center gap-2"><Volume2 size={isMobile ? 12 : 14} /> マスター音量</span>
                          <span>{Math.round(masterVolume * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.01" value={masterVolume} onChange={(e) => { setMasterVolume(parseFloat(e.target.value)); audioEngine.setMasterVolume(parseFloat(e.target.value)); }} className={`w-full ${isMobile ? 'h-1.5' : 'h-2'} bg-black/60 rounded-full appearance-none accent-sakura-400 touch-none`} style={{ touchAction: 'none' }} />
                  </div>
                  
                  {/* 3レイヤー環境音 - 和風デザイン */}
                  <div className={`${isMobile ? 'space-y-2' : 'space-y-2.5'} py-2`}>
                      <div className={`flex items-center gap-2 ${isMobile ? 'mb-2 pb-1.5' : 'mb-2.5 pb-2'} border-b border-white/10`}>
                          <div className={`w-1 ${isMobile ? 'h-4' : 'h-5'} bg-gradient-to-b from-amber-400/60 to-amber-600/40 rounded-full`}></div>
                          <h4 className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-white/80 font-serif tracking-[0.3em]`}>音の層</h4>
                          <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent"></div>
                      </div>
                      
                      {/* ベースレイヤー - 遠くの雨 */}
                      <div className={`relative ${isMobile ? 'p-2.5' : 'p-3'} rounded-lg bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40 border border-slate-700/30 shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm`}>
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
                          <div className={`flex items-center justify-between ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => toggleAmbienceLayer('base')} className={`relative ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-full border-2 transition-all duration-300 flex items-center justify-center active:scale-95 ${ambienceMixer.base.active ? 'bg-indigo-900/50 border-indigo-400/60 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800/50 border-slate-600/40'}`}>
                                      {ambienceMixer.base.active ? (
                                          <Circle size={isMobile ? 9 : 10} className="text-indigo-300 fill-indigo-300" strokeWidth={2.5} />
                                      ) : (
                                          <Circle size={isMobile ? 9 : 10} className="text-slate-500" strokeWidth={1.5} />
                                      )}
                                  </button>
                                  <div>
                                      <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-white/95 font-serif tracking-wider block`}>遠くの雨</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-indigo-300/90 font-serif font-bold`}>{Math.round(ambienceMixer.base.volume * 100)}</span>
                                  <span className={`${isMobile ? 'text-[7px]' : 'text-[8px]'} text-white/40 font-serif`}>%</span>
                              </div>
                          </div>
                          <input type="range" min="0" max="1" step="0.01" value={ambienceMixer.base.volume} onChange={(e) => setAmbienceLayerVolume('base', parseFloat(e.target.value))} disabled={!ambienceMixer.base.active} className={`w-full ${isMobile ? 'h-1' : 'h-1.5'} bg-slate-800/60 rounded-full appearance-none touch-none ${!ambienceMixer.base.active ? 'opacity-30' : ''} ${isMobile ? '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5' : '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-200 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(99,102,241,0.5)] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-200 [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(99,102,241,0.5)]`} style={{accentColor: ambienceMixer.base.active ? '#818cf8' : '#475569', touchAction: 'none'}} />
                      </div>
                      
                      {/* ミドルレイヤー - 軒先の雨 */}
                      <div className={`relative ${isMobile ? 'p-2.5' : 'p-3'} rounded-lg bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40 border border-slate-700/30 shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm`}>
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
                          <div className={`flex items-center justify-between ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => toggleAmbienceLayer('middle')} className={`relative ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-full border-2 transition-all duration-300 flex items-center justify-center active:scale-95 ${ambienceMixer.middle.active ? 'bg-blue-900/50 border-blue-400/60 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-slate-800/50 border-slate-600/40'}`}>
                                      {ambienceMixer.middle.active ? (
                                          <Circle size={isMobile ? 9 : 10} className="text-blue-300 fill-blue-300" strokeWidth={2.5} />
                                      ) : (
                                          <Circle size={isMobile ? 9 : 10} className="text-slate-500" strokeWidth={1.5} />
                                      )}
                                  </button>
                                  <div>
                                      <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-white/95 font-serif tracking-wider block`}>軒先の雨</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-blue-300/90 font-serif font-bold`}>{Math.round(ambienceMixer.middle.volume * 100)}</span>
                                  <span className={`${isMobile ? 'text-[7px]' : 'text-[8px]'} text-white/40 font-serif`}>%</span>
                              </div>
                          </div>
                          <input type="range" min="0" max="1" step="0.01" value={ambienceMixer.middle.volume} onChange={(e) => setAmbienceLayerVolume('middle', parseFloat(e.target.value))} disabled={!ambienceMixer.middle.active} className={`w-full ${isMobile ? 'h-1' : 'h-1.5'} bg-slate-800/60 rounded-full appearance-none touch-none ${!ambienceMixer.middle.active ? 'opacity-30' : ''} ${isMobile ? '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5' : '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-200 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.5)] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-200 [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.5)]`} style={{accentColor: ambienceMixer.middle.active ? '#60a5fa' : '#475569', touchAction: 'none'}} />
                      </div>
                      
                      {/* アクセントレイヤー - 鳥の声など */}
                      <div className={`relative ${isMobile ? 'p-2.5' : 'p-3'} rounded-lg bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40 border border-slate-700/30 shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm`}>
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
                          <div className={`flex items-center justify-between ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => toggleAmbienceLayer('accent')} className={`relative ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-full border-2 transition-all duration-300 flex items-center justify-center active:scale-95 ${ambienceMixer.accent.active ? 'bg-amber-900/50 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-slate-800/50 border-slate-600/40'}`}>
                                      {ambienceMixer.accent.active ? (
                                          <Circle size={isMobile ? 9 : 10} className="text-amber-300 fill-amber-300" strokeWidth={2.5} />
                                      ) : (
                                          <Circle size={isMobile ? 9 : 10} className="text-slate-500" strokeWidth={1.5} />
                                      )}
                                  </button>
                                  <div>
                                      <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-white/95 font-serif tracking-wider block`}>生命の声</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-amber-300/90 font-serif font-bold`}>{Math.round(ambienceMixer.accent.volume * 100)}</span>
                                  <span className={`${isMobile ? 'text-[7px]' : 'text-[8px]'} text-white/40 font-serif`}>%</span>
                              </div>
                          </div>
                          <input type="range" min="0" max="1" step="0.01" value={ambienceMixer.accent.volume} onChange={(e) => setAmbienceLayerVolume('accent', parseFloat(e.target.value))} disabled={!ambienceMixer.accent.active} className={`w-full ${isMobile ? 'h-1' : 'h-1.5'} bg-slate-800/60 rounded-full appearance-none touch-none ${!ambienceMixer.accent.active ? 'opacity-30' : ''} ${isMobile ? '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5' : '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-200 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(251,191,36,0.5)] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-amber-200 [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(251,191,36,0.5)]`} style={{accentColor: ambienceMixer.accent.active ? '#fbbf24' : '#475569', touchAction: 'none'}} />
                      </div>
                  </div>
                  
                  <div className="w-full h-[1px] bg-white/10 my-2"></div>
                  
                  {/* 雨の密度 */}
                  <div className={`${isMobile ? 'space-y-2' : 'space-y-3'} pt-2`}>
                      <div className={`flex justify-between ${isMobile ? 'text-[10px]' : 'text-[11px]'} text-white font-bold uppercase tracking-widest`}>
                          <span>雨の密度</span>
                          <span>{Math.round(rainDensity * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.01" value={rainDensity} onChange={(e) => setRainDensity(parseFloat(e.target.value))} className={`w-full ${isMobile ? 'h-1.5' : 'h-2'} bg-black/60 rounded-full appearance-none accent-indigo-400 touch-none`} style={{ touchAction: 'none' }} />
                  </div>
                  
                  {/* 情景プリセット */}
                  <div className={`${isMobile ? 'space-y-2' : 'space-y-3'} pt-2`}>
                      <h4 className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-white/50 uppercase tracking-[0.2em] font-bold`}>情景プリセット</h4>
                      <div className={`grid grid-cols-2 ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                          {Object.entries(SOUND_PRESETS).map(([key, preset]) => (
                              <button key={key} onClick={() => {
                                  if (preset.isPremium && !isPremium) {
                                      setShowPremiumModal(true);
                                      closePopups();
                                      return;
                                  }
                                  applySoundPreset(key);
                              }} className={`flex items-center gap-2 ${isMobile ? 'p-2.5' : 'p-3'} rounded-xl bg-black/30 border border-white/5 ${isMobile ? 'text-[9px]' : 'text-[10px]'} text-stone-200 active:bg-white/5 active:text-white transition-all uppercase tracking-widest font-bold active:scale-95`}>
                                  <span className="opacity-60">{preset.icon}</span>
                                  <span className="truncate flex items-center gap-1">
                                      {preset.name}
                                      {preset.isPremium && !isPremium && <Lock size={isMobile ? 8 : 10} className="text-amber-400 flex-shrink-0" />}
                                  </span>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
      {showInstruments && (
          <div className={`absolute ${isMobile ? 'top-24 left-4 right-4 max-h-[calc(100vh-8rem)] overflow-y-auto' : 'bottom-36 left-4 sm:left-8'} ${isMobile ? 'w-auto' : 'w-72'} bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl ${isMobile ? 'p-5' : 'p-8'} z-50 animate-in ${isMobile ? 'slide-in-from-top-4' : 'slide-in-from-bottom-4'}`}>
               <div className={`flex justify-between items-center ${isMobile ? 'mb-5 pb-3' : 'mb-8 pb-4'} border-b border-white/10`}>
                  <h3 className={`text-white font-serif ${isMobile ? 'text-xs' : 'text-sm'} tracking-[0.3em] uppercase font-bold`}>Tone Selection</h3>
                  <button onClick={closePopups} className="text-white/50 active:text-white transition-colors"><X size={isMobile ? 18 : 20} /></button>
              </div>
              <div className={`grid grid-cols-2 ${isMobile ? 'gap-1.5' : 'gap-2'} mt-4`}>
                  {(['Suikin', 'Bamboo', 'Crystal', 'MusicBox', 'Ether', 'Deep'] as SoundType[]).map(type => {
                      // Removed 'MusicBox' from premium instruments list
                      const premiumInstruments: string[] = ['Crystal', 'Ether', 'Deep'];
                      const isLocked = premiumInstruments.includes(type) && !isPremium;
                      return (
                        <button key={type} onClick={() => selectInstrument(type)} className={`flex justify-between items-center ${isMobile ? 'px-3 py-2.5 text-[9px]' : 'px-4 py-3 text-[10px]'} rounded-xl tracking-widest uppercase transition-all border active:scale-95 ${currentSoundType === type ? 'bg-sakura-900/40 border-sakura-500 text-sakura-100' : 'bg-black/20 border-white/5 text-stone-400 active:text-white'}`}>
                            <span className="flex items-center gap-2">
                              {SOUND_LABELS[type]}
                              {isLocked && <Lock size={isMobile ? 10 : 12} className="text-amber-400" />}
                            </span>
                        </button>
                      );
                  })}
              </div>
          </div>
      )}
      {showPremiumModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-stone-900 border border-yellow-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-center space-y-6">
                  <Crown size={32} className="text-yellow-400 mx-auto" />
                  <h3 className="text-2xl font-serif text-white tracking-widest">Zen Expansion</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">Support SakuraAme and unlock the full Japanese Garden experience, including the Ancient Temple Bell and meditative Honeybee sounds.</p>
                  <button onClick={handlePurchase} className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl text-black font-bold uppercase tracking-widest text-xs">Unlock All Features</button>
                  <button onClick={() => setShowPremiumModal(false)} className="text-stone-500 text-xs uppercase tracking-widest mt-2 block mx-auto">Maybe later</button>
              </div>
          </div>
      )}
    </div>
  );
};

const AmbienceToggle: React.FC<{ label: string, type: AmbienceType, icon: React.ReactNode, ambience: any, toggle: (t: AmbienceType) => void, isLocked?: boolean }> = ({ label, type, icon, ambience, toggle, isLocked }) => (
    <button onClick={() => toggle(type)} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${ambience[type].active ? 'bg-sakura-900/40 border-sakura-500 text-sakura-100' : 'bg-black/20 border-white/5 text-stone-500'}`}>
        <div className="flex items-center gap-3">{icon}<span className="text-[10px] uppercase tracking-widest font-bold">{label}</span></div>
        {isLocked && ambience[type].isPremium && <Lock size={10} className="text-amber-400" />}
    </button>
);

const DrumButton: React.FC<{ note: Note, activeNote: string | null, spawnDrop: (id: string) => void }> = React.memo(({ note, activeNote, spawnDrop }) => {
    const isActive = activeNote === note.id;
    const petalPath = useMemo(() => "M25 50 C 5 35, 0 10, 25 0 C 50 10, 45 35, 25 50", []);
    const angle = useMemo(() => Math.atan2(note.top - 50, note.left - 50) + Math.PI / 2, [note.top, note.left]);
    const isMobile = useMemo(() => window.innerWidth < 768, []);
    const buttonSize = useMemo(() => isMobile ? 'w-14 h-14' : 'w-16 h-16 md:w-20 md:h-20', [isMobile]);
    
    const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if ('preventDefault' in e) {
            e.preventDefault();
        }
        spawnDrop(note.id);
    }, [note.id, spawnDrop]);
    
    return (
        <button 
            onMouseDown={handleClick} 
            onTouchStart={handleClick} 
            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 active:scale-95 transition-transform"
            style={{ left: `${note.left}%`, top: `${note.top}%` }}
        >
            <div className={`${buttonSize} transition-all duration-1000`} style={{ transform: `rotate(${angle}rad)` }}>
                <div className={`w-full h-full ${isActive ? 'animate-bloom' : 'transition-transform duration-300'}`}>
                    <svg viewBox="0 0 50 50" className="w-full h-full overflow-visible"><path d={petalPath} fill={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.25)'} stroke={isActive ? '#fbcfe8' : 'rgba(255, 255, 255, 0.45)'} strokeWidth="1.0" /></svg>
                </div>
            </div>
        </button>
    );
});

DrumButton.displayName = 'DrumButton';

export default App;
