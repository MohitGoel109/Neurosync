# NeuroSync — AI-Powered Focus & Productivity Optimization System

An AI system that observes attention (webcam), input behavior (keyboard/mouse),
and active-app usage to compute a live **focus score**, surface distraction
alerts, and visualize productivity trends — an HCI/behavioral-analytics
approach rather than emotion detection.

## Architecture

```
Webcam + Keyboard/Mouse + Active Window
              │
              ▼
   Sensing Agent (Python, local-only)
   OpenCV + MediaPipe · pynput · pywinctl
              │  POST /api/readings
              ▼
   Backend (FastAPI + SQLite)
   stores readings, computes stats,
   broadcasts live updates over WebSocket
              │  WS /ws/live  +  REST
              ▼
   Dashboard (React + Tailwind + Recharts)
   Cognitive Radar theme, live radar sweep,
   focus ring, distraction alerts, timeline
```

**Design decision:** the sensing agent is a standalone Python process, not
part of the web frontend — browsers cannot read global keyboard/mouse
activity or the active window/app system-wide, so that layer has to run
natively on the machine being monitored. This keeps the whole AI/CV stack
in one language (Python) and the dashboard as a normal web app that just
reads from the backend.

## Privacy by design

- Webcam frames are processed **locally** by the agent and never transmitted
  or stored — only the derived `looking at screen: true/false` boolean is
  sent to the backend.
- All data stays in a local SQLite file (`backend/neurosync.db`) unless you
  choose to deploy the backend elsewhere.
- The agent prints a clear console notice on startup and should be run with
  an on/off toggle in any user-facing build (not yet in this MVP — see
  Future Work).

## Focus score

`compute_focus_score()` in `agent/focus_score.py` is a transparent, weighted
formula (attention 45%, typing activity 20%, idle penalty 20%, distraction
15%) rather than an ML model. This is intentional for v1: it's explainable
in a viva/defense ("why is my score 62?") and gives a labeled baseline to
later benchmark a learned model against.

## Running it

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Sensing agent (run on the machine you want monitored)
```bash
cd agent
pip install -r requirements.txt
python main.py
```
Requires webcam access and, on macOS, Accessibility permission for the
terminal (for `pynput` global key/mouse listeners).

### 3. Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

### Demo fallback (no webcam / examiner laptop)
Click **"Load demo data"** in the dashboard header, or:
```bash
curl -X POST "http://localhost:8000/api/simulate/seed?hours=3"
```
This seeds three hours of realistic simulated readings so the dashboard,
charts, and radar sweep have data to show even if live capture fails.

## Known limitations (documented honestly for the report)

- **Gaze detection is head-pose + coarse eye direction, not pixel-accurate
  eye tracking.** True gaze tracking needs infrared hardware. Framed as
  "attention presence detection," which is what a webcam can reliably do.
- **Wayland (Linux)** blocks global window-title and input listeners by
  design for user privacy — `pywinctl`/`pynput` are fully supported on
  Windows, macOS, and X11 Linux only.
- **No ML prediction model yet.** The current focus score is a rule-based
  formula (see above); an ML model to *predict* upcoming focus drops is
  scoped as future work once enough labeled session data exists.
- Distraction detection matches against window/tab **titles**, so it can
  miss apps that don't expose the site name in the title bar.

## Future work (scoped out of the 2-week MVP, by design)

- ML model to predict focus drop-off before it happens
- Auto-block distracting apps (OS-level)
- Voice alerts
- Weekly PDF performance reports
- Pomodoro auto-timer integration
- Additional theme skins (Neural Garden, Mission Control, etc. — the
  theming system itself already supports adding more via CSS variables)

## Tech stack

| Layer      | Tech                                   |
|------------|------------------------------------------|
| Attention  | OpenCV, MediaPipe Face Mesh              |
| Behavior   | pynput (keyboard/mouse), pywinctl, psutil |
| Backend    | FastAPI, SQLite, WebSocket               |
| Frontend   | React, Tailwind CSS, Recharts            |
