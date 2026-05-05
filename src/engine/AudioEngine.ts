// 程序化氛围音效引擎 — 零外部素材，全部用 Web Audio API 生成

type Mood = 'silent' | 'dark' | 'morning' | 'neutral' | 'tense' | 'sad' | 'digital' | 'climax';

interface SoundLayer {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  noise?: { node: AudioBufferSourceNode; gain: GainNode };
  lfo?: OscillatorNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentMood: Mood = 'silent';
  private currentLayers: SoundLayer[] = [];
  private fadeTimer: number | null = null;

  private moodParams: Record<Mood, {
    drones: Array<{ freq: number; type: OscillatorType; gain: number; detune?: number }>;
    noise?: { gain: number; low: number; high: number };
    lfo?: { freq: number; target: 'gain' | 'freq'; depth: number };
  } | null> = {
    silent: null,
    dark: {
      drones: [
        { freq: 55, type: 'sine', gain: 0.06 },
        { freq: 82, type: 'sine', gain: 0.03, detune: 5 },
        { freq: 110, type: 'triangle', gain: 0.02, detune: -8 },
      ],
      noise: { gain: 0.04, low: 200, high: 600 },
      lfo: { freq: 0.1, target: 'freq', depth: 3 },
    },
    morning: {
      drones: [
        { freq: 220, type: 'sine', gain: 0.02 },
        { freq: 330, type: 'sine', gain: 0.015 },
        { freq: 440, type: 'triangle', gain: 0.01, detune: 10 },
      ],
      noise: { gain: 0.02, low: 400, high: 1200 },
      lfo: { freq: 0.2, target: 'gain', depth: 0.3 },
    },
    neutral: {
      drones: [
        { freq: 98, type: 'sine', gain: 0.03 },
        { freq: 147, type: 'triangle', gain: 0.02, detune: 7 },
      ],
      noise: { gain: 0.015, low: 300, high: 800 },
    },
    tense: {
      drones: [
        { freq: 65, type: 'sawtooth', gain: 0.025 },
        { freq: 69, type: 'sawtooth', gain: 0.02, detune: 3 },
        { freq: 130, type: 'sine', gain: 0.03 },
      ],
      noise: { gain: 0.05, low: 100, high: 400 },
      lfo: { freq: 0.3, target: 'freq', depth: 5 },
    },
    sad: {
      drones: [
        { freq: 146, type: 'sine', gain: 0.04 },
        { freq: 220, type: 'triangle', gain: 0.02, detune: -12 },
        { freq: 293, type: 'sine', gain: 0.015 },
      ],
      noise: { gain: 0.02, low: 300, high: 1000 },
      lfo: { freq: 0.15, target: 'gain', depth: 0.4 },
    },
    digital: {
      drones: [
        { freq: 120, type: 'square', gain: 0.015 },
        { freq: 180, type: 'triangle', gain: 0.01, detune: 15 },
      ],
      noise: { gain: 0.03, low: 800, high: 3000 },
      lfo: { freq: 0.5, target: 'freq', depth: 8 },
    },
    climax: {
      drones: [
        { freq: 55, type: 'sawtooth', gain: 0.04 },
        { freq: 73, type: 'sine', gain: 0.03, detune: -5 },
        { freq: 110, type: 'triangle', gain: 0.025, detune: 8 },
        { freq: 165, type: 'sine', gain: 0.015 },
      ],
      noise: { gain: 0.06, low: 150, high: 500 },
      lfo: { freq: 0.25, target: 'freq', depth: 6 },
    },
  };

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMood(mood: Mood, fadeTime: number = 2): void {
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (mood === this.currentMood) return;
    this.currentMood = mood;

    const oldLayers = this.currentLayers;
    oldLayers.forEach(layer => {
      layer.gains.forEach(g => {
        g.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + fadeTime);
      });
      if (layer.noise) {
        layer.noise.gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + fadeTime);
      }
    });

    if (this.fadeTimer) clearTimeout(this.fadeTimer);
    this.fadeTimer = window.setTimeout(() => {
      this.cleanup(oldLayers);
    }, fadeTime * 1000 + 200);

    const params = this.moodParams[mood];
    if (!params) {
      this.currentLayers = [];
      return;
    }

    const newLayers: SoundLayer[] = [];

    if (params.noise && this.ctx) {
      const noiseLayer = this.createNoise(
        params.noise.gain * 0,
        params.noise.low,
        params.noise.high
      );
      if (noiseLayer) {
        newLayers.push(noiseLayer);
        if (noiseLayer.noise) {
          noiseLayer.noise.gain.gain.linearRampToValueAtTime(
            params.noise.gain,
            this.ctx.currentTime + fadeTime
          );
        }
      }
    }

    params.drones.forEach(d => {
      const layer = this.createDrone(d.freq, d.type, d.gain * 0, d.detune || 0);
      if (layer) {
        newLayers.push(layer);
        layer.gains.forEach(g => {
          g.gain.linearRampToValueAtTime(d.gain, this.ctx!.currentTime + fadeTime);
        });
      }
    });

    if (params.lfo && newLayers.length > 0) {
      try {
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = params.lfo.freq;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = params.lfo.depth;

        if (params.lfo.target === 'freq') {
          newLayers.forEach(layer => {
            if (layer.oscillators.length > 0) {
              lfoGain.connect(layer.oscillators[0].frequency);
            }
          });
        } else {
          newLayers.forEach(layer => {
            if (layer.gains.length > 0) {
              lfoGain.connect(layer.gains[0].gain);
            }
          });
        }

        lfo.connect(lfoGain);
        lfo.start();
        if (newLayers.length > 0) newLayers[0].lfo = lfo;
      } catch {}
    }

    this.currentLayers = newLayers;
  }

  setVolume(v: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  stop(): void {
    if (this.currentLayers.length > 0) {
      this.cleanup(this.currentLayers);
      this.currentLayers = [];
    }
    this.currentMood = 'silent';
  }

  private createDrone(freq: number, type: OscillatorType, gain: number, detune: number): SoundLayer | null {
    try {
      const osc = this.ctx!.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;

      const g = this.ctx!.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start();

      return { oscillators: [osc], gains: [g] };
    } catch {
      return null;
    }
  }

  private createNoise(gain: number, low: number, high: number): SoundLayer | null {
    try {
      const bufferSize = 2 * this.ctx!.sampleRate;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = this.ctx!.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const bp = this.ctx!.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = (low + high) / 2;
      bp.Q.value = (high + low) / (high - low) * 2;

      const g = this.ctx!.createGain();
      g.gain.value = gain;

      source.connect(bp);
      bp.connect(g);
      g.connect(this.masterGain!);
      source.start();

      return { oscillators: [], gains: [], noise: { node: source, gain: g } };
    } catch {
      return null;
    }
  }

  private cleanup(layers: SoundLayer[]): void {
    layers.forEach(layer => {
      layer.oscillators.forEach(o => { try { o.stop(); } catch {} });
      if (layer.noise) { try { layer.noise.node.stop(); } catch {} }
      if (layer.lfo) { try { layer.lfo.stop(); } catch {} }
    });
  }
}

export const audioEngine = new AudioEngine();
