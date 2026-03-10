'use client';

// ─────────────────────────────────────────────────────────────────────────────
// StartScreen – title screen with difficulty selection
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Difficulty } from '@/types/game';
import { DIFFICULTY, TOTAL_BALLS } from '@/utils/constants';

interface Props {
  highScore: number;
  onStart:   (d: Difficulty) => void;
}

export default function StartScreen({ highScore, onStart }: Props) {
  const [selected, setSelected] = useState<Difficulty>('medium');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6"
      style={{ background: 'rgba(6,6,15,0.97)', zIndex: 20 }}
    >
      {/* Logo / title */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center gap-1"
      >
        {/* Animated ball icon */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-full mb-1"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ffffff, #aabbff, #6677cc)',
            boxShadow:  '0 0 30px #8899ff, 0 0 60px #4455cc44',
          }}
        />
        <h1
          className="text-5xl font-black font-mono uppercase tracking-widest"
          style={{
            background:   'linear-gradient(135deg, #00d4ff, #ff00ff, #ffe600)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            textShadow:   'none',
            filter:       'drop-shadow(0 0 12px #00d4ff88)',
          }}
        >
          Skee-Ball
        </h1>
        <p className="text-cyan-400/60 text-xs font-mono uppercase tracking-widest">
          Arcade Edition
        </p>
      </motion.div>

      {/* High score badge */}
      {highScore > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: 'spring' }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/40"
          style={{ background: '#ff00ff18' }}
        >
          <span className="text-purple-300 font-mono text-xs uppercase tracking-widest">Best</span>
          <span className="text-purple-100 font-black font-mono text-lg">{highScore}</span>
        </motion.div>
      )}

      {/* Difficulty picker */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs flex flex-col gap-2"
      >
        <p className="text-cyan-400/60 text-xs font-mono uppercase tracking-widest text-center mb-1">
          Difficulty
        </p>
        {(Object.keys(DIFFICULTY) as Difficulty[]).map(d => {
          const cfg     = DIFFICULTY[d];
          const isSelected = selected === d;
          const colors: Record<Difficulty, string> = {
            easy:   '#00ff99',
            medium: '#ffe600',
            hard:   '#ff4444',
          };
          const col = colors[d];

          return (
            <motion.button
              key={d}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(d)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-mono text-left"
              style={{
                borderColor: isSelected ? col : '#333355',
                background:  isSelected ? col + '18' : '#0a0a1a',
                boxShadow:   isSelected ? `0 0 18px ${col}44` : 'none',
              }}
            >
              <span className="text-lg">{cfg.emoji}</span>
              <div className="flex-1">
                <div
                  className="font-black text-sm uppercase tracking-wider"
                  style={{ color: isSelected ? col : '#778899' }}
                >
                  {cfg.label}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {cfg.description}
                </div>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="check"
                  className="w-4 h-4 rounded-full"
                  style={{ background: col, boxShadow: `0 0 10px ${col}` }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Start button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ delay: 0.45 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onStart(selected)}
        className="w-full max-w-xs py-4 rounded-2xl font-black font-mono text-xl uppercase tracking-widest text-black"
        style={{
          background:  'linear-gradient(135deg, #00d4ff, #ff00ff)',
          boxShadow:   '0 0 30px #00d4ff66, 0 0 60px #ff00ff44',
        }}
      >
        Play!
      </motion.button>

      {/* Quick rules */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-[11px] font-mono text-slate-500 max-w-xs leading-relaxed"
      >
        {TOTAL_BALLS} balls per game · Drag to aim · Release to throw
        <br />
        Hit the centre for <span className="text-fuchsia-400">100 pts</span>!
      </motion.div>
    </motion.div>
  );
}
