// ─────────────────────────────────────────────────────────────────────────────
// All game-wide constants in one place
// ─────────────────────────────────────────────────────────────────────────────

import type { Vec2, RingDefinition, CornerHole } from '@/types/game';

// ── Canvas virtual resolution ─────────────────────────────────────────────────
export const CANVAS_W = 400;
export const CANVAS_H = 700;

// ── Game rules ────────────────────────────────────────────────────────────────
export const TOTAL_BALLS = 9;
export const HIGH_SCORE_KEY = 'skeeball_hs_v1';

// ── Scoring zone geometry ─────────────────────────────────────────────────────
/** Y-coordinate of the bottom edge of the scoring zone */
export const SCORE_ZONE_BOTTOM = 250;
/** Centre of the concentric scoring rings */
export const RINGS_CENTER: Vec2 = { x: CANVAS_W / 2, y: 128 };

// ── Ball ──────────────────────────────────────────────────────────────────────
export const BALL_RADIUS = 15;
export const BALL_START: Vec2 = { x: CANVAS_W / 2, y: 638 };

// ── Aiming ────────────────────────────────────────────────────────────────────
/** Maximum drag distance that maps to full power */
export const MAX_DRAG = 155;
/** Maximum ball speed in canvas-pixels per frame (at 60 fps) */
export const MAX_SPEED = 15;

// ── Lane walls (ball centre must stay within these x bounds) ─────────────────
export const WALL_LEFT  = BALL_RADIUS + 2;
export const WALL_RIGHT = CANVAS_W - BALL_RADIUS - 2;

// ── Score rings – listed from innermost to outermost ─────────────────────────
export const SCORE_RINGS: RingDefinition[] = [
  { radius: 16,  points: 100, color: '#ff00ff', label: '100' },
  { radius: 34,  points: 50,  color: '#ff2266', label: '50'  },
  { radius: 54,  points: 40,  color: '#ff8c00', label: '40'  },
  { radius: 74,  points: 30,  color: '#ffe600', label: '30'  },
  { radius: 94,  points: 20,  color: '#00ff99', label: '20'  },
  { radius: 114, points: 10,  color: '#00aaff', label: '10'  },
];

// ── Corner bonus holes ────────────────────────────────────────────────────────
export const CORNER_HOLES: CornerHole[] = [
  { pos: { x: RINGS_CENTER.x - 122, y: RINGS_CENTER.y - 68 }, radius: 13, points: 100 },
  { pos: { x: RINGS_CENTER.x + 122, y: RINGS_CENTER.y - 68 }, radius: 13, points: 100 },
];

// ── Neon colour palette ───────────────────────────────────────────────────────
export const COLORS = {
  bg:          '#06060f',
  laneBg:      '#08081a',
  laneBorder:  '#00d4ff',
  scoreBg:     '#050510',
  ball:        '#e8e8ff',
  ballGlow:    '#8899ff',
  aimLine:     'rgba(255,255,80,0.55)',
  aimDot:      'rgba(255,255,80,0.25)',
  wallGlow:    '#00d4ff',
  gutter:      '#0d0d22',
} as const;

// ── Difficulty settings ───────────────────────────────────────────────────────
export const DIFFICULTY = {
  easy: {
    label:          'Easy',
    emoji:          '🟢',
    /** Fraction of trajectory path shown as preview (0 = none, 1 = full) */
    previewFrac:    1.0,
    /** Speed multiplier applied to ball velocity */
    speedMult:      0.82,
    /** Ring radii scaled by this factor (larger = easier targets) */
    ringScale:      1.18,
    description:    'Full trajectory shown, bigger rings',
  },
  medium: {
    label:          'Medium',
    emoji:          '🟡',
    previewFrac:    0.42,
    speedMult:      1.0,
    ringScale:      1.0,
    description:    'Partial trajectory, normal rings',
  },
  hard: {
    label:          'Hard',
    emoji:          '🔴',
    previewFrac:    0.0,
    speedMult:      1.18,
    ringScale:      0.84,
    description:    'No preview, smaller rings',
  },
} as const;
