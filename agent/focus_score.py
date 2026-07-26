"""
Focus score: a weighted, explainable formula rather than an ML black box.

Deliberately NOT machine learning for v1 — a transparent formula is easier
to defend in a viva ("why is the score 62?") and gives you a clean
baseline to later compare an ML model against as future work.
"""

WEIGHTS = {
    "attention": 0.45,   # looking at the screen
    "typing": 0.20,      # active typing (bounded, not "faster = better")
    "idle_penalty": 0.20,
    "distraction": 0.15,
}

IDEAL_WPM = 40  # typing faster than this doesn't add extra score
IDLE_GRACE_SECONDS = 15  # short pauses (thinking) shouldn't tank the score
IDLE_MAX_SECONDS = 120   # idle beyond this counts as fully "away"


def compute_focus_score(
    attention: bool,
    typing_speed_wpm: float,
    idle_seconds: float,
    is_distraction: bool,
) -> float:
    attention_component = 1.0 if attention else 0.0

    typing_component = min(typing_speed_wpm / IDEAL_WPM, 1.0)

    if idle_seconds <= IDLE_GRACE_SECONDS:
        idle_component = 1.0
    else:
        span = IDLE_MAX_SECONDS - IDLE_GRACE_SECONDS
        idle_component = max(0.0, 1 - (idle_seconds - IDLE_GRACE_SECONDS) / span)

    distraction_component = 0.0 if is_distraction else 1.0

    score = (
        WEIGHTS["attention"] * attention_component
        + WEIGHTS["typing"] * typing_component
        + WEIGHTS["idle_penalty"] * idle_component
        + WEIGHTS["distraction"] * distraction_component
    )
    return round(score * 100, 1)
