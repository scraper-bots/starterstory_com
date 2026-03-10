// ─────────────────────────────────────────────────────────────────────────────
// Physics & trajectory utilities
// ─────────────────────────────────────────────────────────────────────────────

import type { Vec2 } from '@/types/game';
import { WALL_LEFT, WALL_RIGHT, MAX_DRAG, MAX_SPEED } from './constants';

// ── Vector helpers ────────────────────────────────────────────────────────────

export function vecLen(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function vecNorm(v: Vec2): Vec2 {
  const len = vecLen(v);
  return len === 0 ? { x: 0, y: -1 } : { x: v.x / len, y: v.y / len };
}

export function vecScale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function vecAdd(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vecDist(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// ── Launch velocity ───────────────────────────────────────────────────────────

/**
 * Convert a drag vector (from ball to where the player dragged) into a
 * launch velocity (slingshot: opposite of drag direction).
 *
 * @param drag - Vector from ball position to current pointer position
 * @param speedMult - Difficulty speed multiplier
 */
export function calcLaunchVel(drag: Vec2, speedMult: number): Vec2 {
  const dragLen = vecLen(drag);
  if (dragLen === 0) return { x: 0, y: -MAX_SPEED * speedMult };

  // Power: 0–1 clamped to drag distance vs MAX_DRAG
  const power = Math.min(dragLen / MAX_DRAG, 1);

  // Invert drag to get launch direction (slingshot feel)
  const dir = vecNorm({ x: -drag.x, y: -drag.y });
  const speed = power * MAX_SPEED * speedMult;

  const vel: Vec2 = {
    x: dir.x * speed,
    y: dir.y * speed,
  };

  // Always travel upward (negative y in canvas coords)
  if (vel.y > 0) vel.y = -Math.abs(vel.y || speed * 0.6);

  return vel;
}

// ── Trajectory simulation ─────────────────────────────────────────────────────

/**
 * Simulate the ball's path from startPos with the given velocity.
 * Returns an array of positions, stopping when ball.y <= stopY.
 *
 * @param stopY  - y coordinate at which to stop (top of scoring zone)
 * @param maxPts - Maximum number of path points to compute
 */
export function simulatePath(
  startPos: Vec2,
  vel: Vec2,
  stopY: number,
  maxPts = 2000,
): Vec2[] {
  const pts: Vec2[] = [];
  let { x, y } = startPos;
  let vx = vel.x;
  const vy = vel.y; // constant – no friction in preview

  for (let i = 0; i < maxPts; i++) {
    x += vx;
    y += vy;

    // Wall reflection
    if (x <= WALL_LEFT) {
      x = WALL_LEFT;
      vx = Math.abs(vx);
    } else if (x >= WALL_RIGHT) {
      x = WALL_RIGHT;
      vx = -Math.abs(vx);
    }

    pts.push({ x, y });
    if (y <= stopY) break;
  }

  return pts;
}

// ── Ball step (used inside the game loop) ────────────────────────────────────

/**
 * Advance ball one frame.  Returns the new position and velocity.
 */
export function stepBall(
  pos: Vec2,
  vel: Vec2,
): { pos: Vec2; vel: Vec2; bounced: boolean } {
  let { x, y } = vecAdd(pos, vel);
  let vx = vel.x;
  let bounced = false;

  if (x <= WALL_LEFT) {
    x = WALL_LEFT;
    vx = Math.abs(vx);
    bounced = true;
  } else if (x >= WALL_RIGHT) {
    x = WALL_RIGHT;
    vx = -Math.abs(vx);
    bounced = true;
  }

  return {
    pos: { x, y },
    vel: { x: vx, y: vel.y },
    bounced,
  };
}
