'use client';

import { useRef, useCallback, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Procedural sound engine using Web Audio API
// ─────────────────────────────────────────────────────────────────────────────

export function useSound() {
  const [sfx, setSfx]     = useState(true);
  const [music, setMusic] = useState(false);
  const ctxRef            = useRef<AudioContext | null>(null);
  const musicRef          = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  /** Lazily create / resume the AudioContext (browsers require user gesture) */
  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  /** Play a short synthesised tone */
  const tone = useCallback(
    (
      freq: number,
      dur: number,
      type: OscillatorType = 'sine',
      vol = 0.28,
      delay = 0,
    ) => {
      if (!sfx) return;
      const ctx = getCtx();
      if (!ctx) return;
      try {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.01);
      } catch { /* AudioContext might not be available (SSR, blocked) */ }
    },
    [sfx, getCtx],
  );

  // ── Individual sound events ────────────────────────────────────────────────

  const playLaunch = useCallback(() => {
    tone(180, 0.12, 'sawtooth', 0.18);
    tone(260, 0.08, 'sine',     0.12, 0.06);
  }, [tone]);

  const playBounce = useCallback(() => {
    tone(320, 0.06, 'square', 0.12);
  }, [tone]);

  const playScore = useCallback((points: number) => {
    const base = 280 + points * 2.8;
    tone(base,        0.18, 'sine',     0.32);
    tone(base * 1.25, 0.14, 'sine',     0.22, 0.12);
    if (points >= 50) {
      tone(base * 1.5, 0.12, 'sine',   0.18, 0.24);
    }
    if (points === 100) {
      tone(base * 2.0, 0.10, 'sine',   0.14, 0.36);
    }
  }, [tone]);

  const playMiss = useCallback(() => {
    tone(120, 0.28, 'square', 0.18);
    tone(90,  0.20, 'square', 0.14, 0.10);
  }, [tone]);

  const playNewHighScore = useCallback(() => {
    [440, 550, 660, 880, 1100].forEach((f, i) =>
      tone(f, 0.18, 'sine', 0.30, i * 0.09),
    );
  }, [tone]);

  const playGameOver = useCallback(() => {
    tone(220, 0.3, 'sawtooth', 0.22);
    tone(180, 0.3, 'sawtooth', 0.18, 0.2);
    tone(140, 0.4, 'sawtooth', 0.16, 0.4);
  }, [tone]);

  // ── Looping background music ───────────────────────────────────────────────

  const startMusic = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || musicRef.current) return;
    try {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      osc.start();
      musicRef.current = { osc, gain };
    } catch { /* ignore */ }
  }, [getCtx]);

  const stopMusic = useCallback(() => {
    if (!musicRef.current) return;
    try {
      musicRef.current.gain.gain.setValueAtTime(0, ctxRef.current!.currentTime);
      musicRef.current.osc.stop(ctxRef.current!.currentTime + 0.05);
    } catch { /* ignore */ }
    musicRef.current = null;
  }, []);

  // Toggle music on/off
  const toggleMusic = useCallback(() => {
    setMusic(prev => {
      if (prev) stopMusic();
      else startMusic();
      return !prev;
    });
  }, [startMusic, stopMusic]);

  const toggleSfx = useCallback(() => setSfx(p => !p), []);

  return {
    sfx, music,
    toggleSfx, toggleMusic,
    playLaunch, playBounce, playScore, playMiss, playNewHighScore, playGameOver,
  };
}
