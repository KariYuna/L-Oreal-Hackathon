import cv2

cascade = cv2.CascadeClassifier(
    "assets/haarcascade_frontalface_default.xml"
)

def detect_faces(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, 1.3, 5)
    return faces
