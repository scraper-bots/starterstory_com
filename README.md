# 🎳 Skee-Ball Arcade

A neon-themed browser Skee-Ball game built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. Aim, release, and try to land in the high-value centre rings!

---

## ✨ Features

- **Full Skee-Ball gameplay** – 9 balls per game, concentric scoring rings (10 / 20 / 30 / 40 / 50 / 100 pts), and two corner bonus holes worth 100 pts each
- **3 difficulty levels** – Easy (trajectory preview + bigger rings), Medium (partial preview), Hard (no preview, smaller rings)
- **Neon arcade aesthetic** – glowing rings, ball trail, animated score pop-ups
- **Ball-by-ball score breakdown** on the end screen with rank badge
- **High score** persisted to `localStorage`
- **Procedural sound effects** via Web Audio API (SFX + music toggle)
- **Fully responsive** – works on desktop, tablet, and mobile
- **Touch controls** – drag-to-aim works with finger input on any touch device
- **Framer Motion animations** throughout (score counter, screens, buttons)
- **Deploy-ready** for Vercel with zero extra configuration

---

## 🕹️ Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Aim    | Click + drag on the lane | Touch + drag on the lane |
| Throw  | Release mouse button | Lift finger |
| Power  | Drag distance (further = more power) | Same |

The launch uses a **slingshot mechanic** — drag in the opposite direction you want the ball to travel. The power arc around the ball turns green → yellow → red as power increases.

---

## 🏆 Scoring

| Ring | Points |
|------|--------|
| Outer (blue) | 10 |
| 2nd (green) | 20 |
| 3rd (yellow) | 30 |
| 4th (orange) | 40 |
| 5th (red) | 50 |
| Centre (magenta) | 100 |
| Corner holes | 100 |
| **Max possible** | **900** |

Rank tiers: Keep Going → Nice Try → Good → Great → Excellent → **LEGENDARY** (800+).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language  | TypeScript (strict) |
| Styling   | Tailwind CSS v4 |
| Animations | Framer Motion |
| Rendering | HTML5 Canvas (2-D context) |
| Sound     | Web Audio API (procedural) |
| Persistence | `localStorage` |
| Deployment | Vercel |

---

## 🚀 Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

---

## ☁️ Deploy to Vercel

### One-click deploy
Push this repo to GitHub, then import it at vercel.com/new.
No extra configuration required — Vercel auto-detects Next.js.

### CLI deploy
```bash
npm i -g vercel
vercel
```

---

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata & viewport
│   ├── page.tsx            # Mounts the Game component
│   └── globals.css         # Tailwind import + global resets
├── components/
│   ├── Game.tsx            # Root client component; wires state + sound
│   ├── SkeeBallCanvas.tsx  # HTML5 Canvas renderer + game loop + input
│   ├── ScoreDisplay.tsx    # HUD (score, balls, sound toggles)
│   ├── StartScreen.tsx     # Title + difficulty select overlay
│   └── EndScreen.tsx       # Animated game-over results overlay
├── hooks/
│   ├── useGameState.ts     # Game phase / score state machine
│   ├── useHighScore.ts     # localStorage high-score hook
│   └── useSound.ts         # Procedural SFX + music via Web Audio API
├── utils/
│   ├── constants.ts        # All game constants (rings, colours, layout)
│   ├── physics.ts          # Vector math, trajectory simulation, ball step
│   └── scoring.ts          # Ring-hit detection
├── types/
│   └── game.ts             # TypeScript interfaces & types
└── public/
    └── favicon.svg         # Custom neon-ball SVG favicon
```
