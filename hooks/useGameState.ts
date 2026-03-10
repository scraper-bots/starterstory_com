'use client';

import { useState, useCallback } from 'react';
import type { GamePhase, Difficulty } from '@/types/game';
import { TOTAL_BALLS } from '@/utils/constants';
import { useHighScore } from './useHighScore';

// ─────────────────────────────────────────────────────────────────────────────
// Game state shape
// ─────────────────────────────────────────────────────────────────────────────

export interface GameState {
  phase:          GamePhase;
  difficulty:     Difficulty;
  ballsLeft:      number;
  ballNumber:     number;   // 1 – TOTAL_BALLS
  scores:         number[]; // individual ball scores
  totalScore:     number;
  lastScore:      number;
  lastLabel:      string;
  isNewHighScore: boolean;
}

const fresh = (difficulty: Difficulty = 'medium'): GameState => ({
  phase:          'start',
  difficulty,
  ballsLeft:      TOTAL_BALLS,
  ballNumber:     0,
  scores:         [],
  totalScore:     0,
  lastScore:      0,
  lastLabel:      '',
  isNewHighScore: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useGameState() {
  const [state, setState]       = useState<GameState>(fresh);
  const { highScore, submit }   = useHighScore();

  /** Go to start screen */
  const goToStart = useCallback(() => setState(fresh()), []);

  /** Begin a game with chosen difficulty */
  const startGame = useCallback((difficulty: Difficulty) => {
    setState({
      ...fresh(difficulty),
      phase:      'ready',
      ballNumber: 1,
    });
  }, []);

  /** Player started dragging to aim */
  const startAiming = useCallback(() =>
    setState(s => s.phase === 'ready' ? { ...s, phase: 'aiming' } : s),
  []);

  /** Player released – ball is now rolling */
  const launchBall = useCallback(() =>
    setState(s => s.phase === 'aiming' ? { ...s, phase: 'rolling' } : s),
  []);

  /** Ball has landed – record the score */
  const recordScore = useCallback((points: number, label: string) => {
    setState(s => {
      const newScores = [...s.scores, points];
      const newTotal  = s.totalScore + points;
      const newLeft   = s.ballsLeft - 1;
      const last      = newLeft === 0;
      const newHigh   = last ? submit(newTotal) : false;

      return {
        ...s,
        phase:          last ? 'gameover' : 'scored',
        scores:         newScores,
        totalScore:     newTotal,
        lastScore:      points,
        lastLabel:      label,
        ballsLeft:      newLeft,
        isNewHighScore: newHigh,
      };
    });
  }, [submit]);

  /** Advance to the next ball after the post-score pause */
  const nextBall = useCallback(() =>
    setState(s =>
      s.phase === 'scored'
        ? { ...s, phase: 'ready', ballNumber: s.ballNumber + 1 }
        : s,
    ),
  []);

  return {
    state, highScore,
    goToStart, startGame, startAiming, launchBall, recordScore, nextBall,
  };
}
