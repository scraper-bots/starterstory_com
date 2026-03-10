'use client';

// ─────────────────────────────────────────────────────────────────────────────
// EndScreen – animated game-over overlay
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import type { Difficulty } from '@/types/game';
import { DIFFICULTY, TOTAL_BALLS } from '@/utils/constants';

interface Props {
  totalScore:     number;
  highScore:      number;
  isNewHighScore: boolean;
  scores:         number[];
  difficulty:     Difficulty;
  onRestart:      () => void;
  onMenu:         () => void;
}

// Rank labels by score
function getRank(score: number): { label: string; color: string; emoji: string } {
  if (score >= 800) return { label: 'LEGENDARY',   color: '#ff00ff', emoji: '🏆' };
  if (score >= 600) return { label: 'EXCELLENT',   color: '#ffe600', emoji: '⭐' };
  if (score >= 400) return { label: 'GREAT',       color: '#00ff99', emoji: '🎯' };
  if (score >= 250) return { label: 'GOOD',        color: '#00d4ff', emoji: '👍' };
  if (score >= 100) return { label: 'NICE TRY',    color: '#aabbff', emoji: '🎳' };
  return              { label: 'KEEP GOING',    color: '#778899', emoji: '💪' };
}

export default function EndScreen({
  totalScore, highScore, isNewHighScore, scores, difficulty, onRestart, onMenu,
}: Props) {
  const rank = getRank(totalScore);
  const max  = TOTAL_BALLS * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-5 overflow-y-auto"
      style={{ background: 'rgba(6,6,15,0.97)', zIndex: 20 }}
    >
      {/* New high score flash */}
      {isNewHighScore && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
          transition={{ duration: 0.5 }}
          className="px-5 py-1.5 rounded-full font-black font-mono text-sm uppercase tracking-widest"
          style={{
            background:  '#ff00ff22',
            color:       '#ff00ff',
            border:      '2px solid #ff00ff',
            boxShadow:   '0 0 24px #ff00ff88',
          }}
        >
          ✨ New High Score!
        </motion.div>
      )}

      {/* Rank badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', bounce: 0.5 }}
        className="flex flex-col items-center gap-1"
      >
        <span className="text-4xl">{rank.emoji}</span>
        <span
          className="text-2xl font-black font-mono uppercase tracking-widest"
          style={{ color: rank.color, filter: `drop-shadow(0 0 10px ${rank.color})` }}
        >
          {rank.label}
        </span>
      </motion.div>

      {/* Score */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col items-center"
      >
        <span className="text-[10px] uppercase tracking-widest text-cyan-400/60 font-mono">Final Score</span>
        <span className="text-6xl font-black font-mono text-white tabular-nums leading-none">
          {totalScore}
        </span>
        <span className="text-xs font-mono text-slate-500 mt-1">
          out of {max} · {DIFFICULTY[difficulty].label}
        </span>
      </motion.div>

      {/* Score bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="w-full max-w-xs h-2.5 rounded-full overflow-hidden bg-slate-800"
        style={{ originX: 0 }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width:      `${(totalScore / max) * 100}%`,
            background: `linear-gradient(90deg, #00d4ff, ${rank.color})`,
            boxShadow:  `0 0 10px ${rank.color}88`,
          }}
        />
      </motion.div>

      {/* Per-ball breakdown */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-xs"
      >
        <p className="text-[10px] uppercase tracking-widest text-cyan-400/60 font-mono mb-2 text-center">
          Ball-by-ball
        </p>
        <div className="grid grid-cols-9 gap-1">
          {scores.map((s, i) => {
            const col = s === 0
              ? '#555577'
              : s >= 100 ? '#ff00ff'
              : s >= 50  ? '#ff2266'
              : s >= 30  ? '#ffe600'
              : s >= 20  ? '#00ff99'
              : '#00aaff';
            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black font-mono"
                  style={{
                    background: col + '22',
                    border:     `2px solid ${col}`,
                    color:      col,
                    boxShadow:  s > 0 ? `0 0 8px ${col}66` : 'none',
                  }}
                >
                  {s}
                </div>
                <span className="text-[8px] text-slate-600 font-mono">{i + 1}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Best score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-xs font-mono text-slate-500"
      >
        Best: <span className="text-purple-300 font-black">{highScore}</span>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="flex gap-3 w-full max-w-xs"
      >
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onRestart}
          className="flex-1 py-3 rounded-xl font-black font-mono text-base uppercase tracking-wider text-black"
          style={{
            background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
            boxShadow:  '0 0 20px #00d4ff55',
          }}
        >
          Play Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onMenu}
          className="px-4 py-3 rounded-xl font-black font-mono text-sm uppercase tracking-wider transition-all"
          style={{
            background:  '#0a0a1a',
            border:      '2px solid #333355',
            color:       '#778899',
          }}
        >
          Menu
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
