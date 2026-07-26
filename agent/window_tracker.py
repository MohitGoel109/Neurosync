"""
Active window / app detection for distraction classification.

Uses pywinctl for cross-platform active-window title lookup (Windows,
macOS, X11 Linux). Wayland Linux is a known limitation — the desktop
protocol intentionally blocks other processes from reading window titles.
Document that clearly rather than silently failing.
"""
import json
from pathlib import Path

import pywinctl as pwc

DEFAULT_BLOCKLIST = [
    "youtube", "instagram", "facebook", "tiktok", "twitter", "x.com",
    "reddit", "netflix", "twitch", "steam", "discord",
]

CONFIG_PATH = Path(__file__).parent / "distraction_config.json"


def load_blocklist() -> list[str]:
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text())["blocklist"]
    CONFIG_PATH.write_text(json.dumps({"blocklist": DEFAULT_BLOCKLIST}, indent=2))
    return DEFAULT_BLOCKLIST


class WindowTracker:
    def __init__(self):
        self.blocklist = load_blocklist()

    def current_app(self) -> str:
        try:
            win = pwc.getActiveWindow()
            if win is None:
                return "unknown"
            # Title usually contains both the app and, for browsers, the
            # page/tab title — which is exactly what we need to catch
            # "YouTube" open inside Chrome, not just "Chrome" itself.
            return win.title or "unknown"
        except Exception:
            return "unknown"

    def is_distraction(self, window_title: str) -> bool:
        title_lower = window_title.lower()
        return any(term in title_lower for term in self.blocklist)
