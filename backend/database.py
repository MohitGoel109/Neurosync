import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "neurosync.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            attention INTEGER NOT NULL,
            typing_speed_wpm REAL DEFAULT 0,
            idle_seconds REAL DEFAULT 0,
            mouse_events INTEGER DEFAULT 0,
            active_app TEXT DEFAULT 'unknown',
            is_distraction INTEGER DEFAULT 0,
            focus_score REAL NOT NULL
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp)"
    )
    conn.commit()
    conn.close()
