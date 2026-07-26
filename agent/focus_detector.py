"""
Attention detection using MediaPipe Face Mesh.

Honest scope note (put this in your report too): this estimates head pose
and coarse eye/iris direction to classify "looking at the screen" vs
"looking away." It is NOT pixel-accurate gaze tracking — that requires
infrared eye trackers. For a productivity signal, presence + head-pose is
a reasonable and well-established proxy.
"""
import time
from dataclasses import dataclass

import cv2
import mediapipe as mp
import numpy as np

# Landmark indices for a lightweight head-pose estimate (nose tip, chin,
# eye corners, mouth corners) — the standard 6-point solvePnP set.
POSE_LANDMARKS = {
    "nose_tip": 1,
    "chin": 152,
    "left_eye_corner": 33,
    "right_eye_corner": 263,
    "left_mouth": 61,
    "right_mouth": 291,
}

# Generic 3D face model points (mm), used with solvePnP to recover head pose.
MODEL_POINTS = np.array(
    [
        (0.0, 0.0, 0.0),          # nose tip
        (0.0, -63.6, -12.5),      # chin
        (-43.3, 32.7, -26.0),     # left eye corner
        (43.3, 32.7, -26.0),      # right eye corner
        (-28.9, -28.9, -24.1),    # left mouth corner
        (28.9, -28.9, -24.1),     # right mouth corner
    ]
)


@dataclass
class AttentionReading:
    face_present: bool
    looking_at_screen: bool
    yaw_deg: float
    pitch_deg: float


class FocusDetector:
    def __init__(self, yaw_threshold=25.0, pitch_threshold=20.0, camera_index=0):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.yaw_threshold = yaw_threshold
        self.pitch_threshold = pitch_threshold
        self.cap = cv2.VideoCapture(camera_index)

    def _estimate_pose(self, landmarks, frame_shape):
        h, w = frame_shape[:2]
        image_points = np.array(
            [
                (landmarks[idx].x * w, landmarks[idx].y * h)
                for idx in POSE_LANDMARKS.values()
            ],
            dtype="double",
        )

        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array(
            [[focal_length, 0, center[0]], [0, focal_length, center[1]], [0, 0, 1]],
            dtype="double",
        )
        dist_coeffs = np.zeros((4, 1))

        success, rotation_vec, _ = cv2.solvePnP(
            MODEL_POINTS, image_points, camera_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if not success:
            return 0.0, 0.0

        rotation_mat, _ = cv2.Rodrigues(rotation_vec)
        proj_matrix = np.hstack((rotation_mat, np.zeros((3, 1))))
        euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)[6]
        pitch, yaw, _ = [float(a) for a in euler_angles]
        if pitch > 90:
            pitch -= 180
        elif pitch < -90:
            pitch += 180
        return yaw, pitch

    def read(self) -> AttentionReading:
        """Grab one frame and classify attention. Call in a loop."""
        ok, frame = self.cap.read()
        if not ok:
            return AttentionReading(False, False, 0.0, 0.0)

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return AttentionReading(False, False, 0.0, 0.0)

        landmarks = results.multi_face_landmarks[0].landmark
        yaw, pitch = self._estimate_pose(landmarks, frame.shape)

        looking = abs(yaw) < self.yaw_threshold and abs(pitch) < self.pitch_threshold
        return AttentionReading(True, looking, yaw, pitch)

    def release(self):
        self.cap.release()


if __name__ == "__main__":
    # Quick manual test: prints attention state at ~2Hz. Press Ctrl+C to stop.
    detector = FocusDetector()
    try:
        while True:
            reading = detector.read()
            print(reading)
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    finally:
        detector.release()
