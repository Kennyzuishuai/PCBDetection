import os
import sys
import cv2
import json
import threading
import subprocess
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import numpy as np

app = Flask(__name__)
CORS(app)

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(PROJECT_ROOT, 'models', 'best.pt')
DEFAULT_MODEL = os.path.join(PROJECT_ROOT, 'yolov8n.pt')

# Global variables
camera = None
model = None
is_training = False
training_process = None

def get_model():
    global model
    if model is None:
        path = MODEL_PATH if os.path.exists(MODEL_PATH) else DEFAULT_MODEL
        print(f"Loading model from: {path}")
        model = YOLO(path)
    return model

def generate_frames(conf_threshold=0.5):
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
    
    local_model = get_model()

    while True:
        success, frame = camera.read()
        if not success:
            break
        
        # Inference
        results = local_model(frame, conf=conf_threshold)
        annotated_frame = results[0].plot()

        ret, buffer = cv2.imencode('.jpg', annotated_frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    conf = float(request.args.get('conf', 0.5))
    return Response(generate_frames(conf), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stop_camera')
def stop_camera():
    global camera
    if camera:
        camera.release()
        camera = None
    return jsonify({"status": "stopped"})

@app.route('/predict', methods=['POST'])
def predict():
    # Check if JSON with path
    if request.is_json:
        data = request.json
        if 'path' in data:
            file_path = data['path']
            if not os.path.exists(file_path):
                 return jsonify({"error": "File not found"}), 404
            
            local_model = get_model()
            results = local_model(file_path)
            
            # Process results (Shared logic - extract to function ideally)
            result = results[0]
            boxes = result.boxes.xywh.tolist()
            classes = result.boxes.cls.tolist()
            confs = result.boxes.conf.tolist()
            names = result.names
            
            detections = []
            for box, cls, conf in zip(boxes, classes, confs):
                detections.append({
                    "class": names[int(cls)],
                    "confidence": conf,
                    "bbox": box
                })
            
            annotated_img = result.plot()
            _, buffer = cv2.imencode('.jpg', annotated_img)
            import base64
            img_base64 = base64.b64encode(buffer).decode('utf-8')

            return jsonify({
                "detections": detections,
                "image": f"data:image/jpeg;base64,{img_base64}"
            })

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save temp file
    temp_path = os.path.join(PROJECT_ROOT, 'temp_upload.jpg')
    file.save(temp_path)

    local_model = get_model()
    results = local_model(temp_path)
    
    # Process results
    result = results[0]
    boxes = result.boxes.xywh.tolist()
    classes = result.boxes.cls.tolist()
    confs = result.boxes.conf.tolist()
    names = result.names
    
    detections = []
    for box, cls, conf in zip(boxes, classes, confs):
        detections.append({
            "class": names[int(cls)],
            "confidence": conf,
            "bbox": box
        })

    # Save annotated image
    annotated_img = result.plot()
    output_path = os.path.join(PROJECT_ROOT, 'temp_result.jpg')
    cv2.imwrite(output_path, annotated_img)
    
    # Read back as base64 or serve static? 
    # For now, let's just return the detection data. 
    # Frontend can request the image or we send base64.
    
    _, buffer = cv2.imencode('.jpg', annotated_img)
    import base64
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return jsonify({
        "detections": detections,
        "image": f"data:image/jpeg;base64,{img_base64}"
    })

@app.route('/train', methods=['POST'])
def start_training():
    global is_training, training_process
    if is_training:
        return jsonify({"status": "already_training"})

    data = request.json
    epochs = data.get('epochs', 100)
    batch = data.get('batch', 16)
    
    # Construct command
    # Assuming we run from project root to find datasets
    cmd = [
        sys.executable, "-m", "ultralytics", "train",
        f"data={os.path.join(PROJECT_ROOT, 'datasets/PCB_DATASET/data.yaml')}",
        f"model={DEFAULT_MODEL}",
        f"epochs={epochs}",
        f"batch={batch}",
        "project=runs/detect",
        "name=train_electron"
    ]
    
    # Spawn process
    try:
        # Use Popen to run in background
        training_process = subprocess.Popen(
            cmd, 
            cwd=PROJECT_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        is_training = True
        
        # Start a thread to read output and (optionally) stream it via WebSocket?
        # For now, just return success.
        return jsonify({"status": "started", "pid": training_process.pid})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stop_training', methods=['POST'])
def stop_training():
    global is_training, training_process
    if training_process:
        training_process.terminate()
        training_process = None
        is_training = False
        return jsonify({"status": "stopped"})
    return jsonify({"status": "not_running"})

@app.route('/system_stats')
def system_stats():
    # Frontend uses systeminformation, but backend can also provide GPU stats if needed
    import psutil
    return jsonify({
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
