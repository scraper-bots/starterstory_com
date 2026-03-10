// ─────────────────────────────────────────────────────────────────────────────
// Core type definitions for the Skee-Ball game
// ─────────────────────────────────────────────────────────────────────────────

/** Phases the game can be in */
export type GamePhase =
  | 'start'    // Title / difficulty select screen
  | 'ready'    // Ball placed, waiting for player to start aiming
  | 'aiming'   // Player dragging to set aim & power
  | 'rolling'  // Ball in motion
  | 'scored'   // Ball landed – brief pause before next ball
  | 'gameover'; // All 9 balls used

/** Player-selected difficulty */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** 2-D vector */
export interface Vec2 {
  x: number;
  y: number;
}

/** One scoring ring definition */
export interface RingDefinition {
  /** Distance from ring centre to outer edge */
  radius: number;
  /** Points awarded for landing in this ring */
  points: number;
  /** Primary colour (hex) */
  color: string;
  /** Human-readable label */
  label: string;
}

/** A small corner bonus hole */
export interface CornerHole {
  pos: Vec2;
  radius: number;
  points: number;
}

/** A floating score pop-up that fades out */
export interface ScorePopup {
  pos: Vec2;
  points: number;
  label: string;
  startTime: number;
  duration: number; // ms
}

/** Sound / music toggle state */
export interface SoundSettings {
  sfx: boolean;
  music: boolean;
}
