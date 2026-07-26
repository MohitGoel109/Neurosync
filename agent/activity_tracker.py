"""
Behavior tracking: typing speed, mouse activity, idle time.

Uses pynput global listeners, which work cross-platform (Windows, macOS,
X11 Linux). Note for the report: macOS requires granting Accessibility
permissions to the terminal/app running this; Wayland Linux restricts
global input listeners for privacy reasons — document this as a known
platform limitation.
"""
import time
from collections import deque
from threading import Lock

from pynput import keyboard, mouse


class ActivityTracker:
    def __init__(self, wpm_window_seconds=10):
        self._lock = Lock()
        self._key_timestamps = deque()
        self._mouse_events = 0
        self._last_activity = time.time()
        self.wpm_window_seconds = wpm_window_seconds

        self._kb_listener = keyboard.Listener(on_press=self._on_key)
        self._mouse_listener = mouse.Listener(
            on_move=self._on_mouse, on_click=self._on_mouse, on_scroll=self._on_mouse
        )

    def start(self):
        self._kb_listener.start()
        self._mouse_listener.start()

    def stop(self):
        self._kb_listener.stop()
        self._mouse_listener.stop()

    def _on_key(self, key):
        with self._lock:
            now = time.time()
            self._key_timestamps.append(now)
            self._last_activity = now
            # Trim anything outside the rolling WPM window.
            cutoff = now - self.wpm_window_seconds
            while self._key_timestamps and self._key_timestamps[0] < cutoff:
                self._key_timestamps.popleft()

    def _on_mouse(self, *args, **kwargs):
        with self._lock:
            self._mouse_events += 1
            self._last_activity = time.time()

    def snapshot(self):
        """Returns (typing_speed_wpm, idle_seconds, mouse_events_since_last_call)."""
        with self._lock:
            now = time.time()
            # Rough WPM: 5 keystrokes ≈ 1 word (standard approximation).
            keys_in_window = len(self._key_timestamps)
            wpm = (keys_in_window / 5) * (60 / self.wpm_window_seconds)
            idle = now - self._last_activity
            mouse_events = self._mouse_events
            self._mouse_events = 0  # reset counter for the next interval
            return round(wpm, 1), round(idle, 1), mouse_events
