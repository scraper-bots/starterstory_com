'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Game – root client component that assembles all game pieces
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameState }    from '@/hooks/useGameState';
import { useSound }        from '@/hooks/useSound';
import SkeeBallCanvas      from './SkeeBallCanvas';
import ScoreDisplay        from './ScoreDisplay';
import StartScreen         from './StartScreen';
import EndScreen           from './EndScreen';
import type { Difficulty } from '@/types/game';

export default function Game() {
  const {
    state, highScore,
    goToStart, startGame, startAiming, launchBall, recordScore, nextBall,
  } = useGameState();

  const {
    sfx, music,
    toggleSfx, toggleMusic,
    playLaunch, playBounce, playScore, playMiss, playNewHighScore, playGameOver,
  } = useSound();

  // ── Wired callbacks with sound ────────────────────────────────────────────

  const handleLaunch = useCallback(() => {
    launchBall();
    playLaunch();
  }, [launchBall, playLaunch]);

  const handleScore = useCallback((points: number, label: string) => {
    recordScore(points, label);
    if (points === 0) {
      playMiss();
    } else {
      playScore(points);
    }
  }, [recordScore, playScore, playMiss]);

  const handleGameOver = useCallback((points: number, label: string) => {
    handleScore(points, label);
    playGameOver();
  }, [handleScore, playGameOver]);

  const handleNewHighScore = useCallback(() => {
    playNewHighScore();
  }, [playNewHighScore]);

  // ── Restart helpers ───────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    startGame(state.difficulty);
  }, [startGame, state.difficulty]);

  // ─────────────────────────────────────────────────────────────────────────

  const isGameActive = state.phase !== 'start' && state.phase !== 'gameover';

  return (
    /*
     * Outer shell – fills the viewport, prevents overflow,
     * centres the game column.
     */
    <div
      className="w-full h-dvh flex items-center justify-center overflow-hidden"
      style={{ background: '#06060f' }}
    >
      {/*
       * Game column – max-width keeps it from being too wide on desktop.
       * On mobile it fills the screen width.
       */}
      <div className="relative w-full max-w-sm h-full flex flex-col" style={{ maxHeight: '100dvh' }}>

        {/* ── HUD (score, balls, sound toggles) ───────────────────────── */}
        {isGameActive && (
          <div className="flex-none px-3 pt-3 pb-2">
            <ScoreDisplay
              totalScore={state.totalScore}
              lastScore={state.lastScore}
              ballsLeft={state.ballsLeft}
              ballNumber={state.ballNumber}
              highScore={highScore}
              lastLabel={state.phase === 'ready' || state.phase === 'aiming' || state.phase === 'rolling'
                ? state.lastLabel
                : state.lastLabel}
              sfx={sfx}
              music={music}
              onToggleSfx={toggleSfx}
              onToggleMusic={toggleMusic}
            />
          </div>
        )}

        {/* ── Canvas (game area) ───────────────────────────────────────── */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {/* Canvas scales to fill this container */}
          <div className="w-full h-full flex items-stretch">
            <SkeeBallCanvas
              phase={state.phase}
              difficulty={state.difficulty}
              ballNumber={state.ballNumber}
              onStartAiming={startAiming}
              onLaunchBall={handleLaunch}
              onScore={handleScore}
              onNextBall={nextBall}
              onBounce={playBounce}
            />
          </div>

          {/* ── Overlay screens ─────────────────────────────────────────── */}
          <AnimatePresence>
            {state.phase === 'start' && (
              <StartScreen
                key="start"
                highScore={highScore}
                onStart={(d: Difficulty) => startGame(d)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {state.phase === 'gameover' && (
              <EndScreen
                key="end"
                totalScore={state.totalScore}
                highScore={highScore}
                isNewHighScore={state.isNewHighScore}
                scores={state.scores}
                difficulty={state.difficulty}
                onRestart={handleRestart}
                onMenu={goToStart}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Difficulty badge (during play) ───────────────────────────── */}
        {isGameActive && (
          <div className="flex-none flex justify-center pb-2 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600">
              {state.difficulty} · ball {state.ballNumber} / 9
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
