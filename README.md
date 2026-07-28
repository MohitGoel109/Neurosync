# NeuroSync — AI-Powered Focus & Productivity Optimization System

An AI system that observes attention (webcam), input behavior (keyboard/mouse),
and active-app usage to compute a live **focus score**, surface distraction
alerts, and visualize productivity trends — an HCI/behavioral-analytics
approach rather than emotion detection.

**Live:** https://neurosync-rho.vercel.app
**API:** https://neurosync-j7m3.onrender.com
**Repo:** https://github.com/MohitGoel109/Neurosync

## At a glance

| | |
|---|---|
| Backend API endpoints | 12 (REST + WebSocket) |
| Frontend React components | 14 |
| Switchable UI themes | 5 |
| Attention detection methods | 2 (local Python agent + in-browser, no-install) |
| ~Lines of code | ~745 Python (backend + agent), ~1,450 JS/JSX (frontend) |
| Focus score inputs | 4 weighted signals (attention 45%, typing 20%, idle 20%, distraction 15%) |
| Deployment | 2 services (Render backend, Vercel frontend), fully public |

## Architecture

```
Webcam + Keyboard/Mouse + Active Window
              │
              ├── Local Python Agent (OpenCV + MediaPipe · pynput · pywinctl)
              │        │  POST /api/readings  (X-API-Key required)
              │
              └── In-Browser Tracking (MediaPipe WASM, runs client-side)
                       │  POST /api/readings/browser  (public, rate-limited)
              ▼
   Backend (FastAPI + SQLite)
   stores readings, computes stats, rate-limited on every endpoint,
   broadcasts live updates over WebSocket
              │  WS /ws/live  +  REST
              ▼
   Dashboard (React + Tailwind + Recharts)
   5 switchable themes, live radar sweep,
   focus ring, history, settings, session tools
```

**Two ways to get real tracking data, by design:**
1. **Local agent** (Python) — full capability: webcam attention, keyboard/mouse behavior, and *actual app/site* distraction detection (e.g. specifically "YouTube," not just "left the browser"). Requires running a script locally; authenticated via API key.
2. **In-browser tracking** (JS/WASM) — zero install, works on any visitor's machine via `getUserMedia` and a client-side MediaPipe model. Trade-off: since a webpage can't see other apps, distraction detection is limited to "left this browser tab," not which app was opened.

## Features

**Attention tracking (webcam)** — MediaPipe Face Mesh/Landmarker head-pose estimation classifies "looking at screen" vs "looking away," entirely locally (no video frames ever leave the device, in either tracking mode).

**Behavior tracking** — typing speed (rolling WPM), idle time, mouse activity.

**Distraction detection** — active window/app title matched against an editable blocklist, editable live from the dashboard Settings page.

**Focus score** — a transparent, weighted formula (not a black-box ML model), computed identically in Python (agent) and JavaScript (browser mode) for consistency. Hover the Focus Ring on the dashboard to see the live component breakdown.

**Dashboard**
- Live radar sweep (Cognitive Radar theme) with a legend — click a distraction ping to see which app and when
- 5 switchable themes: Cognitive Radar, Zen Circuit, Neural Garden, Mission Control, Synthwave Grid (persisted locally)
- Session timer, Pomodoro countdown, focus-streak badge
- Activity-aware status indicator (distinguishes "connected" from "actually receiving live data")
- History page: 7-day distraction chart + recent readings table
- Settings page: theme picker, editable distraction blocklist, formula reference
- In-browser webcam tracking — no install required, explicit opt-in
- Cursor glow + click/tap ripple effects, skeleton loading states
- Keyboard shortcuts: `T` cycle theme, `D` load demo data, `1`/`2`/`3` switch tabs, `?` toggle shortcuts hint
- Simulated demo-data fallback for presenting without live capture

**Backend**
- FastAPI + SQLite, WebSocket live broadcast
- Rate limiting on all 12 endpoints (`slowapi`)
- Two-tier auth model: the local agent's endpoint requires an API key (kept in a local env var, never shipped publicly); the in-browser endpoint is intentionally public but rate-limited, since a "secret" baked into a public frontend bundle isn't actually secret

## Privacy by design

- Webcam frames are processed **locally** — by the Python agent on your machine, or by your own browser in-tab — and never transmitted; only derived booleans/numbers (e.g. "looking at screen: true") are sent.
- The agent's API key lives in a local environment variable, never shipped in the frontend bundle.
- All data stored in SQLite; ephemeral on the free Render tier (resets on restart), acceptable for a public demo.

## Running it locally

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Check it's up: `http://localhost:8000/health` or `http://localhost:8000/docs`.

### 2. Sensing agent (run on the machine you want monitored)
```bash
cd agent
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Requires webcam access and, on macOS, Accessibility permission for the terminal.

### 3. Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 — try both tracking modes (local agent, or the "Enable webcam tracking" button for in-browser mode).

### Demo fallback (no webcam / examiner laptop)
Click **"Load demo data"** in the header, or:
```bash
curl -X POST "http://localhost:8000/api/simulate/seed?hours=3"
```

## Environment variables

| Variable | Where | Purpose | Default |
|---|---|---|---|
| `API_KEY` | backend | Required key for `/api/readings` (agent) and `/api/blocklist` writes | unset (auth disabled) |
| `ALLOWED_ORIGINS` | backend | Comma-separated allowed frontend origins (CORS) | `http://localhost:5173,http://127.0.0.1:5173` |
| `BACKEND_URL` | agent | Where the agent posts readings | `http://localhost:8000/api/readings` |
| `AGENT_API_KEY` | agent | Must match backend's `API_KEY` | unset |
| `VITE_API_BASE` | frontend (build-time) | Backend URL the dashboard talks to | `http://localhost:8000` |

## Deployment

| Service | Platform | URL |
|---|---|---|
| Backend | Render (free tier) | https://neurosync-j7m3.onrender.com |
| Frontend | Vercel | https://neurosync-rho.vercel.app |

Notes: Render's free tier has no persistent disk (SQLite resets on restart) and spins down after 15 min idle (~30-50s cold-start on the next request). A `backend/.python-version` file pins Python to `3.11.9`, since Render's default (3.14 at time of writing) lacks prebuilt wheels for `pydantic-core`.

## Known limitations (documented honestly)

- **Gaze detection is head-pose + coarse eye direction, not pixel-accurate eye tracking** in either mode. True gaze tracking needs infrared hardware.
- **In-browser mode's "distraction" detection is tab-visibility only** — a webpage cannot see which other app or site a visitor switched to, only that they left the tab.
- **Wayland (Linux)** blocks global window-title/input listeners by design; the local agent's `pywinctl`/`pynput` are fully supported on Windows, macOS, and X11 Linux only.
- **No ML prediction model yet** — the focus score is a rule-based formula (explainable by design); predicting upcoming focus drops is future work.
- Local-agent distraction detection matches window/tab **titles**, so it can miss apps that don't expose the site name in the title bar.
- Render free tier: SQLite doesn't persist across restarts — fine for a public demo, not for production data retention.

## Future work
- ML model to predict focus drop-off before it happens
- Auto-block distracting apps (OS-level, local agent only)
- Voice alerts
- Weekly PDF performance reports
- Packaged installer for the agent (PyInstaller)

## Tech stack

| Layer | Tech |
|---|---|
| Attention (agent) | OpenCV, MediaPipe Face Mesh (Python) |
| Attention (browser) | MediaPipe Tasks Vision (WASM/JS), `getUserMedia` |
| Behavior | pynput, pywinctl, psutil |
| Backend | FastAPI, SQLite, WebSocket, slowapi |
| Frontend | React, Tailwind CSS, Recharts |
| Deployment | Render (backend), Vercel (frontend) |
