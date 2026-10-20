import cv2
import os

from Detection.face_detection import detect_faces
from Detection.skin_analysis import analyze_skin, mark_red_spots
from Scoring.scoring import calculate_scores
from Recommendation.recommender import recommend_products


INPUT_DIR = "Images"
OUTPUT_DIR = "OutImages"


def process_images():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for filename in os.listdir(INPUT_DIR):
        if not filename.lower().endswith((".jpg", ".png", ".jpeg")):
            continue

        img_path = os.path.join(INPUT_DIR, filename)
        image = cv2.imread(img_path)

        if image is None:
            print(f"Skipping unreadable file: {filename}")
            continue

        faces = detect_faces(image)

        if len(faces) == 0:
            print(f"No face detected in {filename}")
            continue

        for (x, y, w, h) in faces:
            face = image[y:y+h, x:x+w]

            brightness, redness, texture = analyze_skin(face)
            scores = calculate_scores(brightness, redness, texture)
            products = recommend_products(scores["redness"])

            mark_red_spots(face)

            cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)

            text_y = y - 10
            for k, v in scores.items():
                cv2.putText(
                    image,
                    f"{k}: {v}/10",
                    (x, text_y),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 255),
                    1
                )
                text_y -= 15

        # Save output image
        out_img_path = os.path.join(OUTPUT_DIR, filename)
        cv2.imwrite(out_img_path, image)

        # Save report
        report_path = os.path.join(
            OUTPUT_DIR, filename.rsplit(".", 1)[0] + "_report.txt"
        )

        with open(report_path, "w") as f:
            f.write(f"Image: {filename}\n\n")
            for k, v in scores.items():
                f.write(f"{k.capitalize()}: {v}/10\n")

            f.write("\nRecommendations:\n")
            for p in products:
                f.write(f"- {p}\n")

        print(f"Processed: {filename}")


if __name__ == "__main__":
    process_images()
