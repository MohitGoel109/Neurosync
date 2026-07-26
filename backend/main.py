"""
NeuroSync Backend — FastAPI service
Receives telemetry from the local sensing agent, stores it in SQLite,
and serves aggregated data to the React dashboard.
"""
from datetime import datetime, timedelta
from typing import Optional, List
import random
import json

import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import init_db, get_connection

app = FastAPI(title="NeuroSync API", version="0.1.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

API_KEY = os.environ.get("API_KEY", "")

def require_api_key(x_api_key: str = Header(default="")):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

subscribers: List[WebSocket] = []


async def broadcast(payload: dict):
    dead = []
    for ws in subscribers:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        subscribers.remove(ws)


@app.websocket("/ws/live")
async def live_feed(websocket: WebSocket):
    await websocket.accept()
    subscribers.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        subscribers.remove(websocket)


class Reading(BaseModel):
    timestamp: Optional[str] = None
    attention: bool
    typing_speed_wpm: float = 0.0
    idle_seconds: float = 0.0
    mouse_events: int = 0
    active_app: str = "unknown"
    is_distraction: bool = False
    focus_score: float
    score_components: Optional[dict] = None


class BlocklistPayload(BaseModel):
    blocklist: List[str]


class SessionSummary(BaseModel):
    session_id: int
    started_at: str
    avg_focus_score: float
    distraction_pct: float
    total_minutes: float


@app.post("/api/readings", dependencies=[Depends(require_api_key)])
@limiter.limit("60/minute")
async def post_reading(request: Request, reading: Reading):
    ts = reading.timestamp or datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """INSERT INTO readings
           (timestamp, attention, typing_speed_wpm, idle_seconds, mouse_events,
            active_app, is_distraction, focus_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            ts, int(reading.attention), reading.typing_speed_wpm, reading.idle_seconds,
            reading.mouse_events, reading.active_app, int(reading.is_distraction),
            reading.focus_score,
        ),
    )
    conn.commit()
    conn.close()

    await broadcast(reading.model_dump() | {"timestamp": ts})
    return {"status": "ok"}


@app.get("/api/readings/recent")
@limiter.limit("120/minute")
def recent_readings(request: Request, minutes: int = 30):
    since = (datetime.utcnow() - timedelta(minutes=minutes)).isoformat()
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM readings WHERE timestamp >= ? ORDER BY timestamp ASC", (since,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/stats/today")
@limiter.limit("120/minute")
def stats_today(request: Request):
    since = datetime.utcnow().strftime("%Y-%m-%d")
    conn = get_connection()
    rows = conn.execute("SELECT * FROM readings WHERE timestamp >= ?", (since,)).fetchall()
    conn.close()

    if not rows:
        return {"avg_focus_score": 0, "distraction_pct": 0, "total_readings": 0}

    scores = [r["focus_score"] for r in rows]
    distractions = [r["is_distraction"] for r in rows]
    return {
        "avg_focus_score": round(sum(scores) / len(scores), 1),
        "distraction_pct": round(100 * sum(distractions) / len(distractions), 1),
        "total_readings": len(rows),
    }


@app.get("/api/stats/hourly")
@limiter.limit("120/minute")
def stats_hourly(request: Request):
    conn = get_connection()
    rows = conn.execute(
        """SELECT substr(timestamp, 1, 13) as hour, AVG(focus_score) as avg_score
           FROM readings GROUP BY hour ORDER BY hour ASC"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/simulate/seed")
@limiter.limit("5/hour")
def seed_simulated_data(request: Request, hours: int = 3):
    conn = get_connection()
    now = datetime.utcnow()
    apps = ["VS Code", "Docs", "Terminal", "YouTube", "Instagram", "Slack"]
    distracting = {"YouTube", "Instagram"}

    for i in range(hours * 60):
        ts = (now - timedelta(minutes=hours * 60 - i)).isoformat()
        app_choice = random.choices(apps, weights=[30, 15, 15, 10, 8, 12])[0]
        is_distraction = app_choice in distracting
        attention = random.random() > (0.35 if is_distraction else 0.1)
        base = 40 if is_distraction else 75
        score = max(0, min(100, base + random.gauss(0, 12)))
        conn.execute(
            """INSERT INTO readings
               (timestamp, attention, typing_speed_wpm, idle_seconds, mouse_events,
                active_app, is_distraction, focus_score)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                ts, int(attention), round(random.uniform(20, 70), 1),
                round(random.uniform(0, 45), 1), random.randint(0, 40),
                app_choice, int(is_distraction), round(score, 1),
            ),
        )
    conn.commit()
    conn.close()
    return {"status": "seeded", "readings": hours * 60}


@app.get("/api/stats/daily")
@limiter.limit("120/minute")
def stats_daily(request: Request, days: int = 7):
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    conn = get_connection()
    rows = conn.execute(
        """SELECT substr(timestamp, 1, 10) as day,
                  AVG(focus_score) as avg_score,
                  SUM(is_distraction) * 1.0 / COUNT(*) * 100 as distraction_pct,
                  COUNT(*) as readings
           FROM readings WHERE timestamp >= ?
           GROUP BY day ORDER BY day ASC""",
        (since,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/readings/table")
@limiter.limit("120/minute")
def readings_table(request: Request, limit: int = 50):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM readings ORDER BY timestamp DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


DEFAULT_BLOCKLIST = [
    "youtube", "instagram", "facebook", "tiktok", "twitter", "x.com",
    "reddit", "netflix", "twitch", "steam", "discord",
]


@app.get("/api/blocklist")
@limiter.limit("120/minute")
def get_blocklist(request: Request):
    conn = get_connection()
    row = conn.execute("SELECT value FROM settings WHERE key = 'blocklist'").fetchone()
    conn.close()
    if row:
        return {"blocklist": json.loads(row["value"])}
    return {"blocklist": DEFAULT_BLOCKLIST}


@app.put("/api/blocklist", dependencies=[Depends(require_api_key)])
@limiter.limit("10/hour")
def put_blocklist(request: Request, payload: BlocklistPayload):
    conn = get_connection()
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('blocklist', ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (json.dumps(payload.blocklist),),
    )
    conn.commit()
    conn.close()
    return {"status": "saved", "blocklist": payload.blocklist}


@app.get("/health")
def health():
    return {"status": "ok"}