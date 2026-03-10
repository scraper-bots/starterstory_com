'use client';

// ─────────────────────────────────────────────────────────────────────────────
// SkeeBallCanvas – HTML5 Canvas game renderer + input handler
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useEffect, useCallback } from 'react';
import type { Vec2, GamePhase, Difficulty, ScorePopup } from '@/types/game';
import {
  CANVAS_W, CANVAS_H,
  BALL_RADIUS, BALL_START,
  SCORE_RINGS, CORNER_HOLES, RINGS_CENTER, SCORE_ZONE_BOTTOM,
  WALL_LEFT, WALL_RIGHT,
  MAX_DRAG, COLORS, DIFFICULTY,
} from '@/utils/constants';
import { calcLaunchVel, simulatePath, stepBall, vecDist } from '@/utils/physics';
import { scoreHit } from '@/utils/scoring';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  phase:         GamePhase;
  difficulty:    Difficulty;
  ballNumber:    number;
  onStartAiming: () => void;
  onLaunchBall:  () => void;
  onScore:       (points: number, label: string) => void;
  onNextBall:    () => void;
  onBounce:      () => void;
}

// ── Mutable game-loop state (refs, not re-renders) ────────────────────────────

interface LoopState {
  phase:       GamePhase;
  difficulty:  Difficulty;
  ballPos:     Vec2;
  ballVel:     Vec2;
  trail:       Vec2[];       // last N ball positions for the glow trail
  dragStart:   Vec2 | null;  // pointer-down position
  dragCur:     Vec2 | null;  // current pointer position while dragging
  popup:       ScorePopup | null;
  raf:         number;
}

// ── Helper: pointer position in virtual-canvas coordinates ───────────────────

function getCanvasPos(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Vec2 {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SkeeBallCanvas({
  phase, difficulty, ballNumber,
  onStartAiming, onLaunchBall, onScore, onNextBall, onBounce,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // All mutable game state lives here to avoid re-renders in the RAF loop
  const gs = useRef<LoopState>({
    phase,
    difficulty,
    ballPos:    { ...BALL_START },
    ballVel:    { x: 0, y: 0 },
    trail:      [],
    dragStart:  null,
    dragCur:    null,
    popup:      null,
    raf:        0,
  });

  // Sync React props → ref (needed because RAF closure captures the ref)
  useEffect(() => { gs.current.phase      = phase;      }, [phase]);
  useEffect(() => { gs.current.difficulty = difficulty; }, [difficulty]);

  // Reset ball position when a new ball becomes ready
  useEffect(() => {
    if (phase === 'ready') {
      gs.current.ballPos   = { ...BALL_START };
      gs.current.ballVel   = { x: 0, y: 0 };
      gs.current.trail     = [];
      gs.current.dragStart = null;
      gs.current.dragCur   = null;
      gs.current.popup     = null;
    }
  }, [phase, ballNumber]);

  // ── Drawing helpers ────────────────────────────────────────────────────────

  const drawGlow = (
    ctx: CanvasRenderingContext2D,
    color: string,
    blur: number,
    fn: () => void,
  ) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur  = blur;
    fn();
    ctx.restore();
  };

  // ── Main draw function ─────────────────────────────────────────────────────

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { phase: p, difficulty: d, ballPos, dragStart, dragCur, trail, popup } = gs.current;
    const cfg = DIFFICULTY[d];

    // 1 ── Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2 ── Lane gutter strips (left & right of lane)
    ctx.fillStyle = COLORS.gutter;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); // already covered by bg; decorative

    // 3 ── Lane body
    ctx.fillStyle = COLORS.laneBg;
    ctx.fillRect(0, SCORE_ZONE_BOTTOM, CANVAS_W, CANVAS_H - SCORE_ZONE_BOTTOM);

    // Lane lane markers (dotted centre line)
    ctx.save();
    ctx.setLineDash([10, 16]);
    ctx.lineWidth   = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2, SCORE_ZONE_BOTTOM);
    ctx.lineTo(CANVAS_W / 2, CANVAS_H);
    ctx.stroke();
    ctx.restore();

    // Lane side walls with neon glow
    drawGlow(ctx, COLORS.wallGlow, 14, () => {
      ctx.strokeStyle = COLORS.laneBorder;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(0, SCORE_ZONE_BOTTOM);
      ctx.lineTo(0, CANVAS_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CANVAS_W, SCORE_ZONE_BOTTOM);
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.stroke();
    });

    // 4 ── Scoring zone background
    ctx.fillStyle = COLORS.scoreBg;
    ctx.fillRect(0, 0, CANVAS_W, SCORE_ZONE_BOTTOM);

    // Scoring zone border (bottom edge)
    drawGlow(ctx, COLORS.wallGlow, 14, () => {
      ctx.strokeStyle = COLORS.laneBorder;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(0, SCORE_ZONE_BOTTOM);
      ctx.lineTo(CANVAS_W, SCORE_ZONE_BOTTOM);
      ctx.stroke();
    });

    // 5 ── Score rings (outer → inner so inner always paints on top)
    const ringScale = cfg.ringScale;
    const rings     = [...SCORE_RINGS].reverse();

    rings.forEach((ring) => {
      const r = ring.radius * ringScale;
      drawGlow(ctx, ring.color, 18, () => {
        ctx.beginPath();
        ctx.arc(RINGS_CENTER.x, RINGS_CENTER.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth   = 2.5;
        ctx.stroke();

        // Subtle fill
        ctx.fillStyle = ring.color + '14'; // ~8% opacity
        ctx.fill();
      });

      // Ring point label
      ctx.fillStyle   = ring.color;
      ctx.font        = 'bold 10px monospace';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      const labelY    = RINGS_CENTER.y - r + 9;
      if (labelY > 0 && labelY < SCORE_ZONE_BOTTOM - 4) {
        ctx.fillText(ring.label, RINGS_CENTER.x, labelY);
      }
    });

    // Inner 100-pt circle (filled)
    const inner = SCORE_RINGS[0];
    const innerR = inner.radius * ringScale;
    drawGlow(ctx, inner.color, 24, () => {
      ctx.beginPath();
      ctx.arc(RINGS_CENTER.x, RINGS_CENTER.y, innerR, 0, Math.PI * 2);
      ctx.fillStyle = inner.color + '55';
      ctx.fill();
      ctx.strokeStyle = inner.color;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
    });

    // 6 ── Corner bonus holes
    CORNER_HOLES.forEach(hole => {
      const r = hole.radius * ringScale;
      drawGlow(ctx, '#ff00ff', 20, () => {
        ctx.beginPath();
        ctx.arc(hole.pos.x, hole.pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00ff55';
        ctx.fill();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth   = 2;
        ctx.stroke();
      });
      ctx.fillStyle    = '#ff00ff';
      ctx.font         = 'bold 9px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('100', hole.pos.x, hole.pos.y);
    });

    // 7 ── Trajectory preview (while aiming, based on difficulty)
    if ((p === 'aiming') && dragStart && dragCur && cfg.previewFrac > 0) {
      const drag: Vec2 = { x: dragCur.x - dragStart.x, y: dragCur.y - dragStart.y };
      const vel        = calcLaunchVel(drag, cfg.speedMult);
      const path       = simulatePath(ballPos, vel, SCORE_ZONE_BOTTOM - BALL_RADIUS);

      const showCount = Math.floor(path.length * cfg.previewFrac);
      ctx.save();
      for (let i = 0; i < showCount; i += 4) {
        const fade = 1 - i / showCount;
        ctx.globalAlpha = fade * 0.55;
        ctx.fillStyle   = COLORS.aimDot;
        ctx.beginPath();
        ctx.arc(path[i].x, path[i].y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 8 ── Aim indicator (rubber-band arrow while dragging)
    if ((p === 'aiming' || p === 'ready') && dragStart && dragCur) {
      const drag: Vec2 = { x: dragCur.x - dragStart.x, y: dragCur.y - dragStart.y };
      const power      = Math.min(vecDist(dragStart, dragCur) / MAX_DRAG, 1);

      // Line from ball to drag point
      ctx.save();
      ctx.strokeStyle = COLORS.aimLine;
      ctx.lineWidth   = 2;
      ctx.setLineDash([6, 5]);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(ballPos.x, ballPos.y);
      ctx.lineTo(dragCur.x, dragCur.y);
      ctx.stroke();
      ctx.restore();

      // Power arc around ball
      const powerColor = power < 0.4 ? '#00ff88' : power < 0.7 ? '#ffe600' : '#ff4444';
      ctx.save();
      ctx.strokeStyle = powerColor;
      ctx.lineWidth   = 3;
      ctx.shadowColor = powerColor;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(ballPos.x, ballPos.y, BALL_RADIUS + 8, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 9 ── Ball trail
    if (p === 'rolling') {
      trail.forEach((pt, i) => {
        const alpha = (i / trail.length) * 0.45;
        const radius = BALL_RADIUS * (i / trail.length) * 0.7;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.ballGlow;
        ctx.fill();
        ctx.restore();
      });
    }

    // 10 ── Ball
    if (p !== 'gameover') {
      // Outer glow
      const ballGrad = ctx.createRadialGradient(
        ballPos.x - BALL_RADIUS * 0.3, ballPos.y - BALL_RADIUS * 0.3, 1,
        ballPos.x, ballPos.y, BALL_RADIUS,
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.6, COLORS.ball);
      ballGrad.addColorStop(1, COLORS.ballGlow);

      drawGlow(ctx, COLORS.ballGlow, 20, () => {
        ctx.beginPath();
        ctx.arc(ballPos.x, ballPos.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();
      });

      // Seam lines
      ctx.save();
      ctx.strokeStyle = 'rgba(100,120,200,0.3)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(ballPos.x, ballPos.y, BALL_RADIUS * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 11 ── Score popup
    if (popup) {
      const age     = Date.now() - popup.startTime;
      const frac    = Math.min(age / popup.duration, 1);
      const alpha   = frac < 0.2 ? frac / 0.2 : 1 - (frac - 0.2) / 0.8;
      const offsetY = -50 * frac;
      const scale   = 1 + (popup.points > 0 ? 0.5 * (1 - frac) : 0);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(popup.pos.x, popup.pos.y + offsetY);
      ctx.scale(scale, scale);
      ctx.font         = `bold ${popup.points >= 50 ? 32 : 24}px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      const col = popup.points === 0
        ? '#ff4444'
        : popup.points >= 100 ? '#ff00ff'
        : popup.points >= 50  ? '#ff2266'
        : '#ffe600';

      ctx.shadowColor = col;
      ctx.shadowBlur  = 20;
      ctx.fillStyle   = col;
      ctx.fillText(
        popup.points > 0 ? `+${popup.points}` : popup.label,
        0, 0,
      );
      ctx.restore();

      if (frac >= 1) gs.current.popup = null;
    }

    // 12 ── "Tap to aim" hint
    if (p === 'ready') {
      const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 450);
      ctx.save();
      ctx.globalAlpha  = pulse;
      ctx.fillStyle    = 'rgba(255,255,255,0.7)';
      ctx.font         = '13px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Drag to aim  •  Release to throw', CANVAS_W / 2, CANVAS_H - 28);
      ctx.restore();
    }
  }, []);

  // ── Game loop ──────────────────────────────────────────────────────────────

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx) return;

    const state = gs.current;

    // Advance ball when rolling
    if (state.phase === 'rolling') {
      const { pos, vel, bounced } = stepBall(state.ballPos, state.ballVel);
      if (bounced) onBounce();

      // Keep a short trail
      state.trail = [...state.trail.slice(-30), { ...state.ballPos }];
      state.ballPos = pos;

      // Ball entered scoring zone
      if (pos.y <= SCORE_ZONE_BOTTOM - BALL_RADIUS) {
        const cfg    = DIFFICULTY[state.difficulty];
        const result = scoreHit(pos, cfg.ringScale);

        state.popup = {
          pos:       { ...pos },
          points:    result.points,
          label:     result.label,
          startTime: Date.now(),
          duration:  1400,
        };

        // Reset ball to resting position (visually hide it)
        state.ballPos = { x: pos.x, y: SCORE_ZONE_BOTTOM + BALL_RADIUS };
        state.ballVel = { x: 0, y: 0 };
        state.trail   = [];

        onScore(result.points, result.label);

        // Transition back to 'ready' automatically after delay
        setTimeout(() => onNextBall(), 1500);
      }

      // Safety: ball went out of bounds or stalled below start area
      if (pos.y > CANVAS_H + 50) {
        state.ballPos = { ...BALL_START };
        state.ballVel = { x: 0, y: 0 };
        state.trail   = [];
        onScore(0, 'Miss!');
        setTimeout(() => onNextBall(), 1500);
      }
    }

    draw(ctx);
    state.raf = requestAnimationFrame(loop);
  }, [draw, onBounce, onScore, onNextBall]);

  // Start / stop the RAF loop
  useEffect(() => {
    gs.current.raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gs.current.raf);
  }, [loop]);

  // ── Pointer input (unified mouse + touch) ─────────────────────────────────

  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = gs.current.phase;
    if (p !== 'ready' && p !== 'aiming') return;

    const pos = getCanvasPos(canvas, clientX, clientY);
    // Only accept presses in the lower (lane) portion of the canvas
    if (pos.y < SCORE_ZONE_BOTTOM) return;

    gs.current.dragStart = pos;
    gs.current.dragCur   = pos;
    if (p === 'ready') onStartAiming();
  }, [onStartAiming]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !gs.current.dragStart) return;
    gs.current.dragCur = getCanvasPos(canvas, clientX, clientY);
  }, []);

  const handlePointerUp = useCallback(() => {
    const state = gs.current;
    if (state.phase !== 'aiming' || !state.dragStart || !state.dragCur) return;

    const drag: Vec2 = {
      x: state.dragCur.x - state.dragStart.x,
      y: state.dragCur.y - state.dragStart.y,
    };

    // Require a minimum drag distance to launch
    const dragLen = Math.hypot(drag.x, drag.y);
    if (dragLen < 8) {
      state.dragStart = null;
      state.dragCur   = null;
      return;
    }

    const cfg        = DIFFICULTY[state.difficulty];
    state.ballVel    = calcLaunchVel(drag, cfg.speedMult);
    state.dragStart  = null;
    state.dragCur    = null;
    onLaunchBall();
  }, [onLaunchBall]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => handlePointerDown(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handlePointerMove(e.clientX, e.clientY);
  const onMouseUp   = () => handlePointerUp();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerUp();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="w-full touch-none select-none cursor-crosshair"
      style={{ imageRendering: 'pixelated' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    />
  );
}
