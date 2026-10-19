import cv2
from collections import deque

from Detection.face_detection import detect_faces
from Detection.skin_analysis import analyze_skin, mark_red_spots
from Scoring.scoring import calculate_scores
from Recommendation.recommender import recommend_products


# rolling buffers for stable scores
brightness_hist = deque(maxlen=15)
redness_hist = deque(maxlen=15)
texture_hist = deque(maxlen=15)


def draw_panel(frame, scores, products):
    h, w, _ = frame.shape
    panel_x = w - 280

    cv2.rectangle(frame, (panel_x, 0), (w, h), (25, 25, 25), -1)

    y = 50
    for k, v in scores.items():
        cv2.putText(frame, f"{k.upper()}: {v}/10",
                    (panel_x + 20, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        y += 40

    cv2.putText(frame, "RECOMMENDATIONS",
                (panel_x + 20, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    y += 30

    for p in products:
        cv2.putText(frame, f"- {p}",
                    (panel_x + 20, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        y += 25


def start_camera():
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        faces = detect_faces(frame)

        for (x, y, w, h) in faces:
            face = frame[y:y+h, x:x+w]

            brightness, redness, texture = analyze_skin(face)

            brightness_hist.append(brightness)
            redness_hist.append(redness)
            texture_hist.append(texture)

            avg_brightness = sum(brightness_hist) / len(brightness_hist)
            avg_redness = sum(redness_hist) / len(redness_hist)
            avg_texture = sum(texture_hist) / len(texture_hist)

            scores = calculate_scores(avg_brightness, avg_redness, avg_texture)
            products = recommend_products(scores["redness"])

            mark_red_spots(face)

            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

            if scores["redness"] <= 2:
                msg = "Skin condition looks healthy"
            elif scores["redness"] <= 5:
                msg = "Minor skin concerns detected"
            else:
                msg = "Visible skin concerns detected"

            cv2.putText(frame, msg, (30, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

            draw_panel(frame, scores, products)

        cv2.imshow("Face Recommend System", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('c'):
            cv2.imwrite("skin_snapshot.jpg", frame)
            print("Snapshot saved")
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
