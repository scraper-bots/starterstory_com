'use client';

import { useState, useCallback } from 'react';
import { HIGH_SCORE_KEY } from '@/utils/constants';

/** Reads / writes the high score in localStorage */
export function useHighScore() {
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    return raw ? parseInt(raw, 10) : 0;
  });

  /**
   * Call with the player's final score.
   * Returns true if it beats the stored high score.
   */
  const submit = useCallback(
    (score: number): boolean => {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
        return true;
      }
      return false;
    },
    [highScore],
  );

  return { highScore, submit };
}
