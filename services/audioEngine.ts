
import { SoundType, AmbienceType, AmbienceLayer } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private shishiodoshiGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  
  // 3レイヤー構成の環境音
  private baseLayer: { source: AudioBufferSourceNode | null, gain: GainNode | null, filter: BiquadFilterNode | null, buffer: AudioBuffer | null } = {
    source: null,
    gain: null,
    filter: null,
    buffer: null
  };
  
  private middleLayer: { source: AudioBufferSourceNode | null, gain: GainNode | null, filter: BiquadFilterNode | null, buffer: AudioBuffer | null } = {
    source: null,
    gain: null,
    filter: null,
    buffer: null
  };
  
  private accentLayerState: { active: boolean, volume: number } = { active: false, volume: 0.4 };
  private windVolumeScale: number = 1.0; // 風の音量スケール（弱い: 0.5, 強い: 1.5）
  private accentTimeout: number | null = null;
  
  private kapponBuffer: AudioBuffer | null = null;
  
  // アクセント音の再生タイマー
  private accentTimerHandle: number | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      
      // マスターコンプレッサー（音割れ防止）
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      
      // マスターローパスフィルター（高周波ノイズ除去）- より優しく
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = 10000; // 10kHzでカット（より柔らかい）
      this.masterFilter.Q.value = 0.707; // バターワース特性
      
      // マスターゲイン
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      
      // 接続: compressor -> filter -> gain -> destination
      this.compressor.connect(this.masterFilter);
      this.masterFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.shishiodoshiGain = this.ctx.createGain();
      this.shishiodoshiGain.connect(this.ctx.destination);
      this.shishiodoshiGain.gain.value = 1.0;

      this.createKapponSound();
      this.createAmbienceLayers();
      this.startAccentLayerLoop();
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  fadeOutMaster(duration: number, onComplete?: () => void) {
    if (!this.masterGain || !this.ctx) return;
    const current = this.masterGain.gain.value;
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(current, this.ctx.currentTime);
    // より優しい指数関数的フェードアウト - ZEN体験のため
    this.masterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    setTimeout(() => {
      onComplete?.();
    }, duration * 1000);
  }

  createAmbienceLayers() {
    if (!this.ctx || !this.compressor) return;
    
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 2 * sampleRate;
    
    // ベースレイヤー（遠くの雨）- 低域重視、中央定位
    this.baseLayer.buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const baseData = this.baseLayer.buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      baseData[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    // ミドルレイヤー（軒先の雨）- 中域重視、やや広がり
    this.middleLayer.buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const middleData = this.middleLayer.buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      middleData[i] = (Math.random() * 2 - 1) * 0.4;
    }
  }

  setAmbienceLayer(layer: AmbienceLayer, active: boolean, volume: number, windStrength?: 'weak' | 'strong' | 'normal') {
    if (!this.ctx || !this.compressor) return;
    
    if (layer === 'base') {
      this.setBaseLayer(active, volume);
    } else if (layer === 'middle') {
      this.setMiddleLayer(active, volume);
    } else if (layer === 'accent') {
      this.accentLayerState.active = active;
      this.accentLayerState.volume = volume;
      // 風の強さを設定
      if (windStrength === 'weak') {
        this.windVolumeScale = 0.5;
      } else if (windStrength === 'strong') {
        this.windVolumeScale = 1.5;
      } else {
        this.windVolumeScale = 1.0;
      }
      if (!active && this.accentTimerHandle) {
        clearTimeout(this.accentTimerHandle);
        this.accentTimerHandle = null;
      }
    }
  }

  setBaseLayer(active: boolean, volume: number) {
    if (!this.ctx || !this.compressor || !this.baseLayer.buffer) return;
    
    if (active) {
      if (!this.baseLayer.source) {
        const source = this.ctx.createBufferSource();
        source.buffer = this.baseLayer.buffer;
        source.loop = true;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600; // 遠くの雨は低域のみ
        filter.Q.value = 0.7;
        
        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        
        // 中央定位（パンなし、広がりを持たせる）
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = 0; // 中央
        
        // 接続: source -> filter -> panner -> gain -> compressor
        source.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(this.compressor);
        
        source.start();
        
        // 優しいフェードイン（3秒かけて）- ZEN体験のため
        gain.gain.setTargetAtTime(volume * 0.12, this.ctx.currentTime, 3.0);
        
        this.baseLayer.source = source;
        this.baseLayer.gain = gain;
        this.baseLayer.filter = filter;
      } else {
        const gain = this.baseLayer.gain;
        if (gain) {
          gain.gain.setTargetAtTime(volume * 0.12, this.ctx.currentTime, 0.5);
        }
      }
    } else {
      if (this.baseLayer.gain) {
        // 優しいフェードアウト（3.5秒かけて）- 余韻を感じる
        this.baseLayer.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 3.5);
        setTimeout(() => {
          if (this.baseLayer.source) {
            try { this.baseLayer.source.stop(); } catch(e) {}
            this.baseLayer.source = null;
            this.baseLayer.gain = null;
            this.baseLayer.filter = null;
          }
        }, 3600);
      }
    }
  }

  setMiddleLayer(active: boolean, volume: number) {
    if (!this.ctx || !this.compressor || !this.middleLayer.buffer) return;
    
    if (active) {
      if (!this.middleLayer.source) {
        const source = this.ctx.createBufferSource();
        source.buffer = this.middleLayer.buffer;
        source.loop = true;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2500; // 軒先の雨は中域まで
        filter.Q.value = 1.0;
        
        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        
        // やや広がりを持たせる（パンなし）
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = 0;
        
        // 接続: source -> filter -> panner -> gain -> compressor
        source.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(this.compressor);
        
        source.start();
        
        // 優しいフェードイン（2.5秒かけて）- ZEN体験のため
        gain.gain.setTargetAtTime(volume * 0.18, this.ctx.currentTime, 2.5);
        
        this.middleLayer.source = source;
        this.middleLayer.gain = gain;
        this.middleLayer.filter = filter;
      } else {
        const gain = this.middleLayer.gain;
        if (gain) {
          gain.gain.setTargetAtTime(volume * 0.18, this.ctx.currentTime, 0.5);
        }
      }
    } else {
      if (this.middleLayer.gain) {
        // 優しいフェードアウト（3秒かけて）- 余韻を感じる
        this.middleLayer.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 3.0);
        setTimeout(() => {
          if (this.middleLayer.source) {
            try { this.middleLayer.source.stop(); } catch(e) {}
            this.middleLayer.source = null;
            this.middleLayer.gain = null;
            this.middleLayer.filter = null;
          }
        }, 3100);
      }
    }
  }

  startAccentLayerLoop() {
    if (!this.ctx) return;
    
    const scheduleNextAccent = () => {
      if (!this.accentLayerState.active || this.ctx?.state !== 'running') {
        this.accentTimerHandle = window.setTimeout(scheduleNextAccent, 5000);
        return;
      }
      
      // 15秒〜60秒の間でランダム
      const delay = 15000 + Math.random() * 45000; // 15秒〜60秒
      
      this.accentTimerHandle = window.setTimeout(() => {
        if (this.accentLayerState.active && this.ctx?.state === 'running') {
          // ランダムにアクセント音を選択
          const sounds = ['birds', 'windChime', 'wind', 'suikinkutsu', 'mejiro', 'frog'] as const;
          const soundType = sounds[Math.floor(Math.random() * sounds.length)];
          
          switch(soundType) {
            case 'birds':
              this.playUguisu(this.accentLayerState.volume);
              break;
            case 'windChime':
              this.playWindChime(this.accentLayerState.volume);
              break;
            case 'wind':
              this.playWind(this.accentLayerState.volume * this.windVolumeScale);
              break;
            case 'suikinkutsu':
              this.playSuikinkutsu(this.accentLayerState.volume);
              break;
            case 'mejiro':
              this.playMejiro(this.accentLayerState.volume);
              break;
            case 'frog':
              this.playFrog(this.accentLayerState.volume);
              break;
          }
        }
        scheduleNextAccent();
      }, delay);
    };
    
    scheduleNextAccent();
  }

  playWind(vol: number) {
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;
    const duration = 8 + Math.random() * 12; // 8〜20秒
    
    // 風の音は左から（パン-0.7）
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = -0.7; // 左寄り
    
    // ホワイトノイズベース
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    // バンドパスフィルター（風の特徴的な周波数帯域）
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 200 + Math.random() * 400; // 200〜600Hz
    filter.Q.value = 0.8;
    
    // LFOで風の強弱を表現
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.3 + Math.random() * 0.4; // 0.3〜0.7Hz
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.4;
    
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    
    // 接続: source -> filter -> panner -> gain -> compressor
    // LFOはgainに接続
    source.connect(filter);
    filter.connect(panner);
    panner.connect(gain);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    gain.connect(this.compressor);
    
    source.start(t);
    lfo.start(t);
    
    // 優しいフェードイン/アウト
    gain.gain.setTargetAtTime(vol * 0.12, t, 3.0);
    gain.gain.setTargetAtTime(vol * 0.12, t + duration - 3, 2.5);
    gain.gain.setTargetAtTime(0, t + duration - 1, 1.0);
    
    source.stop(t + duration);
    lfo.stop(t + duration);
  }

  // 後方互換性のため残す（ただし非推奨）
  setAmbience(type: AmbienceType, active: boolean, vol: number) {
    // 新しいレイヤーシステムに移行
    if (type === 'rain') {
      this.setBaseLayer(active, vol);
      this.setMiddleLayer(active, vol);
    } else if (['birds', 'windChime', 'suikinkutsu', 'wind', 'mejiro', 'frog'].includes(type)) {
      this.setAmbienceLayer('accent', active, vol, 'normal');
    }
  }

  playTone(freq: number, type: SoundType = 'Suikin') {
    if (!this.ctx || !this.compressor) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    gain.connect(this.compressor);

    switch (type) {
      case 'Crystal':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        modulator.frequency.value = freq * 3.5;
        modGain.gain.value = freq * 0.8;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
        break;
      case 'MusicBox':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        const overtone = this.ctx.createOscillator();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(freq * 2.01, t);
        const oGain = this.ctx.createGain();
        oGain.gain.setValueAtTime(0.15, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
        overtone.connect(oGain);
        oGain.connect(gain);
        overtone.start(t);
        overtone.stop(t + 4);
        break;
      case 'Ether':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        modulator.frequency.value = freq * 0.5;
        modGain.gain.value = freq * 2;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
        break;
      case 'Deep':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.5, t);
        modulator.frequency.value = freq * 1.5;
        modGain.gain.value = freq * 3;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 6.0);
        break;
      case 'Bamboo':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        modulator.frequency.value = freq * 1.414;
        modGain.gain.value = freq * 0.5;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        break;
      case 'Suikin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.4, t);
        modulator.frequency.value = freq * 5.05;
        modGain.gain.value = freq * 0.25;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.08, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
        break;
    }

    if (type !== 'MusicBox') {
        modulator.connect(modGain);
        modGain.connect(osc.frequency);
    }
    osc.connect(gain);

    osc.start(t);
    if (modulator && type !== 'MusicBox') {
        modulator.start(t);
        modulator.stop(t + 6);
    }
    osc.stop(t + 6);
  }

  createKapponSound() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const duration = 3.0; // より長い余韻のため延長
    const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        
        // 1. 打撃音（カッ）- 短く鋭いクリック音（竹と石の瞬間的な接触）
        const impactClick = Math.sin(t * 3500 * Math.PI * 2) * Math.exp(-t * 800) * 0.4;
        const clickNoise = (Math.random() * 2 - 1) * Math.exp(-t * 600) * 0.15;
        
        // 2. 竹の打撃音（コーン）- 中低域の打撃音（竹自体の振動）
        // 基本周波数: 約280Hz（竹の特性周波数）、倍音を追加
        const bambooFundamental = 280;
        const bamboo1 = Math.sin(t * bambooFundamental * Math.PI * 2) * Math.exp(-t * 25) * 0.6;
        const bamboo2 = Math.sin(t * bambooFundamental * 2 * Math.PI * 2) * Math.exp(-t * 35) * 0.25;
        const bamboo3 = Math.sin(t * bambooFundamental * 3 * Math.PI * 2) * Math.exp(-t * 45) * 0.12;
        
        // 3. 石との共鳴音 - より硬質で低い周波数
        const stoneResonance = 180;
        const stone = Math.sin(t * stoneResonance * Math.PI * 2) * Math.exp(-t * 15) * 0.3;
        
        // 4. 竹の余韻 - 長く響く振動（竹が揺れる音）
        const resonance = Math.sin(t * 320 * Math.PI * 2) * Math.exp(-t * 4) * 0.2;
        const resonance2 = Math.sin(t * 380 * Math.PI * 2) * Math.exp(-t * 5) * 0.15;
        
        // 5. 微細な振動成分（竹の材質感）
        const texture = (Math.random() * 0.02) * Math.exp(-t * 8);
        
        // 合成（打撃音は最初の0.01秒のみ、その後は共鳴と余韻）
        let sample = 0;
        if (t < 0.01) {
            // 最初の打撃音
            sample = (impactClick + clickNoise + bamboo1 + bamboo2 + stone) * 1.2;
        } else if (t < 0.1) {
            // 打撃後の響き
            sample = (bamboo1 + bamboo2 + bamboo3 + stone) * 0.8;
        } else {
            // 余韻
            sample = (resonance + resonance2 + texture) * 0.6;
        }
        
        // クリッピング防止と音量調整
        data[i] = Math.max(-1, Math.min(1, sample * 0.9));
    }
    this.kapponBuffer = buffer;
  }

  playShishiodoshi() {
    if (!this.ctx || !this.kapponBuffer || !this.shishiodoshiGain) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.kapponBuffer;
    
    // 竹の音に適したフィルター処理（自然な響きを出すため）
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2500; // 高域を少しカットして自然な竹の音に
    filter.Q.value = 1.0;
    
    // 軽いコンプレッションで打撃音を自然に
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.001;
    compressor.release.value = 0.1;
    
    // 接続: source -> filter -> compressor -> gain -> destination
    source.connect(filter);
    filter.connect(compressor);
    compressor.connect(this.shishiodoshiGain);
    source.start();
  }

  playTempleBell() {
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;
    const baseFreq = 82.41; // E2 approximate
    
    const bellGain = this.ctx.createGain();
    bellGain.connect(this.compressor);
    
    // Characteristical "Wan-wan" beating effect LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 1.05; 
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.25;
    lfo.connect(lfoGain);
    lfoGain.connect(bellGain.gain);

    bellGain.gain.setValueAtTime(0, t);
    bellGain.gain.linearRampToValueAtTime(0.8, t + 0.01);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 15);

    const partials = [
        { f: 1.0, g: 1.0, d: 15 },
        { f: 2.002, g: 0.5, d: 12 },
        { f: 2.98, g: 0.35, d: 10 },
        { f: 3.95, g: 0.2, d: 8 },
        { f: 5.14, g: 0.15, d: 6 },
        { f: 7.8, g: 0.1, d: 4 }
    ];

    partials.forEach(p => {
        const osc = this.ctx!.createOscillator();
        const pGain = this.ctx!.createGain();
        osc.frequency.setValueAtTime(baseFreq * p.f, t);
        pGain.gain.setValueAtTime(p.g, t);
        pGain.gain.exponentialRampToValueAtTime(0.001, t + p.d);
        osc.connect(pGain);
        pGain.connect(bellGain);
        osc.start(t);
        osc.stop(t + p.d + 1);
    });
    lfo.start(t);
    lfo.stop(t + 16);
  }

  playUguisu(vol: number) {
      if (!this.ctx || !this.compressor) return;
      const t = this.ctx.currentTime;
      
      // 鳥の声は右から（パン+1.0）
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = 0.7; // 右寄り
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.compressor);
      
      // より優しいフェードイン/アウト - ZEN体験のため
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.45, t + 0.2); // より緩やかなフェードイン
      gain.gain.linearRampToValueAtTime(vol * 0.45, t + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2); // より長い余韻
      osc.frequency.setValueAtTime(2500, t); 
      osc.frequency.linearRampToValueAtTime(2400, t + 0.8);
      
      const t2 = t + 1.2;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      const panner2 = this.ctx.createStereoPanner();
      panner2.pan.value = 0.65; // 右寄り（やや中央寄り）
      
      osc2.connect(gain2);
      gain2.connect(panner2);
      panner2.connect(this.compressor);
      
      gain2.gain.setValueAtTime(0, t2);
      gain2.gain.linearRampToValueAtTime(vol * 0.6, t2 + 0.12); 
      gain2.gain.linearRampToValueAtTime(vol * 0.2, t2 + 0.25); 
      gain2.gain.linearRampToValueAtTime(vol * 0.7, t2 + 0.45); 
      gain2.gain.linearRampToValueAtTime(0, t2 + 1.05); 
      osc2.frequency.setValueAtTime(2500, t2);
      osc2.frequency.setValueAtTime(2500, t2 + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1800, t2 + 0.25);
      osc2.frequency.linearRampToValueAtTime(3500, t2 + 0.4);
      osc2.frequency.linearRampToValueAtTime(2000, t2 + 0.9);
      osc.start(t); osc.stop(t + 1.0);
      osc2.start(t2); osc2.stop(t2 + 1.1);
  }

  playWindChime(vol: number) {
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;
    const numChimes = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numChimes; i++) {
        const start = t + (i * 0.25 * Math.random());
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();
        
        // 風鈴は中央寄りでランダムに配置
        panner.pan.value = (Math.random() - 0.5) * 0.4; // -0.2 〜 0.2
        
        const freq = 1800 + Math.random() * 1200;
        osc.frequency.setValueAtTime(freq, start);
        osc.type = 'sine';
        
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.compressor);
        
        // より優しい余韻のある減衰
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol * 0.22, start + 0.05); // より緩やかなフェードイン
        gain.gain.exponentialRampToValueAtTime(0.001, start + 3.5); // より長い余韻
        osc.start(start);
        osc.stop(start + 3.5);
    }
  }

  playSuikinkutsu(vol: number) {
      if (!this.ctx || !this.compressor) return;
      const t = this.ctx.currentTime;
      const baseFreqs = [146.83, 196.00, 246.94];
      const freq = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
      
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = (Math.random() - 0.5) * 0.3; // 中央寄りでランダム
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const partials = [1, 2.01, 3.5, 5.05];
      partials.forEach((p, i) => {
          const pOsc = this.ctx!.createOscillator();
          const pGain = this.ctx!.createGain();
          pOsc.frequency.setValueAtTime(freq * p, t);
          pGain.gain.setValueAtTime(0.25 / (i + 1), t);
          pGain.gain.exponentialRampToValueAtTime(0.001, t + 5);
          pOsc.connect(pGain);
          pGain.connect(gain);
          pOsc.start(t);
          pOsc.stop(t + 5.5);
      });
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
      // より優しい余韻のある減衰
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.10, t + 0.05); // より緩やかなフェードイン
      gain.gain.exponentialRampToValueAtTime(0.001, t + 7); // より長い余韻
      
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.compressor);
      osc.start(t);
      osc.stop(t + 6);
  }

  playMejiro(vol: number) {
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;

    // メジロの鳴き声は中央寄り
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() - 0.5) * 0.4; // -0.2 〜 0.2

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.compressor);

    // メジロの特徴的な高音の鳴き声（約3000-4000Hz）
    const baseFreq = 3200 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.15, t + 0.1);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, t + 0.2);
    osc.frequency.linearRampToValueAtTime(baseFreq, t + 0.3);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.05);
    gain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  playFrog(vol: number) {
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;

    // カエルの鳴き声は中央寄り（やや下）
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() - 0.5) * 0.5; // -0.25 〜 0.25

    // カエルの特徴的な低音の鳴き声（約400-800Hz）
    const baseFreq = 500 + Math.random() * 300;
    const numCalls = Math.floor(Math.random() * 2) + 2; // 2-3回

    for (let i = 0; i < numCalls; i++) {
      const start = t + i * 0.3;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth'; // カエルらしい音色
      osc.frequency.setValueAtTime(baseFreq, start);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.85, start + 0.1);
      osc.frequency.linearRampToValueAtTime(baseFreq, start + 0.15);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol * 0.35, start + 0.03);
      gain.gain.linearRampToValueAtTime(vol * 0.35, start + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.compressor);

      osc.start(start);
      osc.stop(start + 0.25);
    }
  }

  // 後方互換性のため残す（ただし使用しない）
  playCricket(vol: number) {}
  playBeeBuzz(vol: number) {}
  playDistantThunder(vol: number) {}
}

export const audioEngine = new AudioEngine();