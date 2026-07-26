"""
NeuroSync sensing agent — run this locally alongside the backend.

    python main.py

It loops roughly once per second: reads webcam attention, activity
counters, and the active window, computes a focus score, and POSTs the
reading to the FastAPI backend. All video frames stay on this machine —
only the derived attention boolean is sent, never the image.
"""
import time
import requests

from focus_detector import FocusDetector
from activity_tracker import ActivityTracker
from window_tracker import WindowTracker
from focus_score import compute_focus_score

BACKEND_URL = "http://localhost:8000/api/readings"
POLL_INTERVAL_SECONDS = 2


def main():
    print("NeuroSync agent starting — press Ctrl+C to stop.")
    print("Privacy note: webcam frames are processed locally and never leave this machine.")

    focus_detector = FocusDetector()
    activity_tracker = ActivityTracker()
    window_tracker = WindowTracker()
    activity_tracker.start()

    try:
        while True:
            attention_reading = focus_detector.read()
            wpm, idle_seconds, mouse_events = activity_tracker.snapshot()
            active_app = window_tracker.current_app()
            is_distraction = window_tracker.is_distraction(active_app)

            score = compute_focus_score(
                attention=attention_reading.looking_at_screen,
                typing_speed_wpm=wpm,
                idle_seconds=idle_seconds,
                is_distraction=is_distraction,
            )

            payload = {
                "attention": attention_reading.looking_at_screen,
                "typing_speed_wpm": wpm,
                "idle_seconds": idle_seconds,
                "mouse_events": mouse_events,
                "active_app": active_app,
                "is_distraction": is_distraction,
                "focus_score": score,
            }

            try:
                requests.post(BACKEND_URL, json=payload, timeout=2)
            except requests.exceptions.RequestException as e:
                print(f"[warn] could not reach backend: {e}")

            print(f"score={score:5.1f}  attention={attention_reading.looking_at_screen}  "
                  f"app={active_app[:30]:30s}  distraction={is_distraction}")

            time.sleep(POLL_INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\nStopping agent...")
    finally:
        focus_detector.release()
        activity_tracker.stop()


if __name__ == "__main__":
    main()
