'use client';

// ─────────────────────────────────────────────────────────────────────────────
// ScoreDisplay – HUD showing score, balls, and high score
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOTAL_BALLS } from '@/utils/constants';

interface Props {
  totalScore:  number;
  lastScore:   number;
  ballsLeft:   number;
  ballNumber:  number;
  highScore:   number;
  lastLabel:   string;
  sfx:         boolean;
  music:       boolean;
  onToggleSfx:   () => void;
  onToggleMusic: () => void;
}

export default function ScoreDisplay({
  totalScore, lastScore, ballsLeft, ballNumber,
  highScore, lastLabel, sfx, music, onToggleSfx, onToggleMusic,
}: Props) {
  const ballsDone  = TOTAL_BALLS - ballsLeft;

  return (
    <div className="w-full flex flex-col gap-2 px-1">

      {/* ── Main score row ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        {/* Total score */}
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400/70 font-mono">Score</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={totalScore}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              className="text-3xl font-black font-mono text-white tabular-nums leading-none"
            >
              {totalScore}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Last throw result */}
        <AnimatePresence>
          {lastLabel && (
            <motion.div
              key={`${ballNumber}-${lastLabel}`}
              initial={{ scale: 0.6, opacity: 0, y: -10 }}
              animate={{ scale: 1.0, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <span className="text-[10px] uppercase tracking-widest text-yellow-400/70 font-mono">Last</span>
              <span
                className="text-xl font-black font-mono tabular-nums"
                style={{
                  color: lastScore === 0
                    ? '#ff4444'
                    : lastScore >= 100 ? '#ff00ff'
                    : lastScore >= 50  ? '#ff2266'
                    : '#ffe600',
                }}
              >
                {lastScore > 0 ? `+${lastScore}` : lastLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* High score */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-purple-400/70 font-mono">Best</span>
          <span className="text-xl font-black font-mono text-purple-300 tabular-nums leading-none">
            {highScore}
          </span>
        </div>
      </div>

      {/* ── Ball indicators ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-cyan-400/60 font-mono mr-1">
          Balls
        </span>
        {Array.from({ length: TOTAL_BALLS }).map((_, i) => {
          const used    = i < ballsDone;
          const current = i === ballsDone;
          return (
            <motion.div
              key={i}
              animate={current ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.9 }}
              className="rounded-full border-2 transition-all duration-300"
              style={{
                width:  12,
                height: 12,
                background: used
                  ? 'transparent'
                  : current
                    ? '#e8e8ff'
                    : '#4444aa',
                borderColor: used
                  ? '#333355'
                  : current
                    ? '#ffffff'
                    : '#6666cc',
                boxShadow: current ? '0 0 8px #aabbff' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* ── Sound toggles ────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          onClick={onToggleSfx}
          className="text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded border transition-all"
          style={{
            borderColor: sfx ? '#00d4ff' : '#333355',
            color:       sfx ? '#00d4ff' : '#555577',
            background:  sfx ? '#00d4ff12' : 'transparent',
          }}
        >
          SFX {sfx ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={onToggleMusic}
          className="text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded border transition-all"
          style={{
            borderColor: music ? '#ff00ff' : '#333355',
            color:       music ? '#ff00ff' : '#555577',
            background:  music ? '#ff00ff12' : 'transparent',
          }}
        >
          Music {music ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
