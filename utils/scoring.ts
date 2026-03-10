// ─────────────────────────────────────────────────────────────────────────────
// Scoring – determine which ring (or hole) a ball landed in
// ─────────────────────────────────────────────────────────────────────────────

import type { Vec2 } from '@/types/game';
import { SCORE_RINGS, CORNER_HOLES, RINGS_CENTER } from './constants';

export interface ScoringResult {
  points: number;
  label: string;
  /** true when the ball missed everything */
  miss: boolean;
}

/**
 * Given the ball's position when it entered the scoring zone,
 * return the score and display label.
 *
 * @param pos       - Ball centre position (canvas coords)
 * @param ringScale - Difficulty scaling factor for ring radii
 */
export function scoreHit(pos: Vec2, ringScale: number): ScoringResult {
  // 1. Check corner bonus holes first
  for (const hole of CORNER_HOLES) {
    const d = Math.hypot(pos.x - hole.pos.x, pos.y - hole.pos.y);
    if (d <= hole.radius * ringScale) {
      return { points: hole.points, label: '100! 🎯', miss: false };
    }
  }

  // 2. Check concentric rings (inner → outer; first match wins)
  const d = Math.hypot(pos.x - RINGS_CENTER.x, pos.y - RINGS_CENTER.y);
  for (const ring of SCORE_RINGS) {
    if (d <= ring.radius * ringScale) {
      return { points: ring.points, label: ring.label, miss: false };
    }
  }

  // 3. Gutter / miss
  return { points: 0, label: 'Miss!', miss: true };
}
