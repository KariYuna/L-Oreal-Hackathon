import cv2
import numpy as np

def analyze_skin(face):
    hsv = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)

    brightness = np.mean(hsv[:, :, 2])

    red_channel = face[:, :, 2]
    redness = np.mean(red_channel)

    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    texture = np.var(gray)

    return brightness, redness, texture


def mark_red_spots(face):
    red = face[:, :, 2]
    _, thresh = cv2.threshold(red, 150, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    for c in contours:
        if cv2.contourArea(c) > 40:
            x, y, w, h = cv2.boundingRect(c)
            cv2.circle(face, (x + w//2, y + h//2), 5, (0, 0, 255), 1)
