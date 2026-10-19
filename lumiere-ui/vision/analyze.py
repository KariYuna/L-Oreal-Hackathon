"""Local experimental image observations; deliberately no diagnostic scoring."""
import os
os.environ['OPENCV_IO_MAX_IMAGE_PIXELS'] = str(16000000)
import sys, json, base64, io, importlib.util
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = 16000000
ORIGINAL = Path(__file__).resolve().parent / 'original'

def analyze(data):
    raw = base64.b64decode(data.split(',', 1)[1], validate=True)
    if len(raw) > 6 * 1024 * 1024:
        raise ValueError('Please use a photo smaller than 6 MB.')
    with Image.open(io.BytesIO(raw)) as source:
        if source.format not in ('JPEG', 'PNG'):
            raise ValueError('Please choose a JPG or PNG.')
        if source.width * source.height > 16000000:
            raise ValueError('Please resize the image to under 16 megapixels.')
        photo = ImageOps.exif_transpose(source).convert('RGB')
        photo.thumbnail((1600, 1600))
    frame = cv2.cvtColor(np.array(photo), cv2.COLOR_RGB2BGR)
    # OpenCV's Windows filename loader cannot reliably open accented paths.
    # Python reads the original XML as Unicode, then OpenCV reads it in memory.
    xml = (ORIGINAL / 'haarcascade_frontalface_default.xml').read_text(encoding='utf-8')
    storage = cv2.FileStorage(xml, cv2.FILE_STORAGE_READ | cv2.FILE_STORAGE_MEMORY)
    cascade = cv2.CascadeClassifier()
    cascade.read(storage.getFirstTopLevelNode())
    storage.release()
    if cascade.empty():
        raise ValueError('The original face-detection file is missing.')
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=6, minSize=(90, 90))
    if len(faces) == 0:
        raise ValueError('No clear front-facing face found. Use even light, face the camera and remove filters.')
    if len(faces) != 1:
        raise ValueError('Please use a photo with exactly one person.')
    x,y,w,h = map(int, faces[0])
    if min(w,h) < 150:
        raise ValueError('Your face is too small in this photo. Move closer and try again.')
    face = frame[y:y+h, x:x+w]
    spec = importlib.util.spec_from_file_location('original_skin_analysis', ORIGINAL / 'skin_analysis.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    brightness, red, texture = module.analyze_skin(face)
    sharpness = float(cv2.Laplacian(cv2.cvtColor(face,cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
    flags = []
    if brightness < 65: flags.append('The photo is dark. Retake in soft, even daylight.')
    if brightness > 235: flags.append('The photo may be overexposed. Avoid direct light.')
    if sharpness < 35: flags.append('The photo may be blurry. Hold the camera steady.')
    # Supplement the original whole-face statistics with two fixed cheek regions.
    # These are geometric crops, NOT validated skin segmentation or erythema detection.
    cheeks = [face[int(h*.48):int(h*.70),int(w*.15):int(w*.35)], face[int(h*.48):int(h*.70),int(w*.65):int(w*.85)]]
    pixels = np.concatenate([c.reshape(-1,3) for c in cheeks]).astype(float)
    red_fraction = float(np.mean(pixels[:,2] / np.maximum(pixels.sum(axis=1), 1)))
    photo.thumbnail((480,480))
    buf=io.BytesIO();photo.save(buf,format='JPEG',quality=82)
    return {'version':'opencv-observations-v1','faceCount':1,'quality':{'usable':not flags,'flags':flags,'sharpness':round(sharpness,1)},'metrics':{'brightness':round(float(brightness),1),'redChannel':round(float(red),1),'pixelVariation':round(float(texture),1),'cheekRedFraction':round(red_fraction,3)},'summary':'One face found. These are image measurements, not skin-health scores.','limitations':['Lighting, makeup, camera processing and skin tone affect these values.','This tool cannot diagnose acne, dehydration, irritation, pores or fine lines.','Changing values do not prove that a product helped or that skin improved.'],'photo':'data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()}

if __name__ == '__main__':
    try:
        payload=json.load(sys.stdin)
        print(json.dumps(analyze(payload['image'])))
    except Exception as e:
        message=str(e) if isinstance(e,ValueError) else 'The image could not be analyzed. Please use a clear JPG or PNG under 16 megapixels.'
        print(json.dumps({'error':message}))
        sys.exit(1)
