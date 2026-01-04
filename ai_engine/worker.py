import pika
import json
import time
import os
import sys
import numpy as np
import pandas as pd
from pymongo import MongoClient
from minio import Minio
from dotenv import load_dotenv
from sklearn.ensemble import IsolationForest
import io

load_dotenv(dotenv_path="../.env")

# --- Configuration ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/veritas_stream")
RABBIT_URI = os.getenv("RABBIT_URI", "amqp://guest:guest@127.0.0.1:5672")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET = os.getenv("MINIO_SECRET_KEY")

# --- Connect Services ---
print("⏳ Connecting to MongoDB...")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database()
reports_collection = db.reports  # Note: This points to 'analysis_reports' via the Model

print("⏳ Connecting to MinIO...")
minio_client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS, secret_key=MINIO_SECRET, secure=False)

# --- Feature Extraction ---
def extract_features(lines):
    """Convert text lines into numerical features for the AI."""
    features = []
    for line in lines:
        # Feature 1: Line Length
        length = len(line)
        # Feature 2: Count of special characters (often high in attacks/shellcode)
        special_chars = sum(not c.isalnum() and not c.isspace() for c in line)
        # Feature 3: Entropy approximation (unique chars / length)
        entropy = len(set(line)) / length if length > 0 else 0
        
        features.append([length, special_chars, entropy])
    return np.array(features)

# --- AI Analysis ---
def analyze_log_file(bucket, object_name):
    print(f"🧠 Downloading {object_name}...")
    
    # 1. Download File from MinIO
    try:
        response = minio_client.get_object(bucket, object_name)
        content = response.read().decode('utf-8', errors='ignore')
        lines = content.splitlines()
        response.close()
        response.release_conn()
    except Exception as e:
        print(f"❌ MinIO Error: {e}")
        return None

    if len(lines) < 2:
        return {"anomalies": 0, "risk_score": 0, "plot_data": [], "summary": "File too short for ML analysis."}

    print(f"📊 Extracted {len(lines)} lines. Running Isolation Forest...")

    # 2. Extract Features
    X = extract_features(lines)

    # 3. Train Model (Unsupervised)
    # contamination=0.05 means we expect ~5% of data to be anomalies
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(X)
    
    # 4. Predict (-1 is anomaly, 1 is normal)
    predictions = model.predict(X)
    scores = model.decision_function(X) # How "normal" it is (lower is worse)

    # 5. Process Results
    anomalies_count = list(predictions).count(-1)
    
    # Prepare Plot Data (X=Line Number, Y=Anomaly Score)
    # We invert the score so higher = more anomalous for easier graphing
    plot_data = []
    suspicious_lines = []
    
    for i, (pred, score) in enumerate(zip(predictions, scores)):
        risk_value = round(-score * 100, 2) # Scale for graph
        plot_data.append({
            "line": i + 1,
            "risk": risk_value if risk_value > 0 else 0,
            "is_anomaly": bool(pred == -1)
        })
        
        if pred == -1:
            suspicious_lines.append(f"Line {i+1}: {lines[i][:100]}...")

    # Calculate Summary Risk
    risk_score = min(anomalies_count * 5, 100) # Simple cap at 100
    summary = f"Isolation Forest detected {anomalies_count} anomalies."
    if anomalies_count > 0:
        summary += f" Top suspect: {suspicious_lines[0]}"

    return {
        "anomalies": anomalies_count,
        "risk_score": risk_score,
        "plot_data": plot_data, # <--- Sending graph data to Frontend!
        "summary": summary
    }

# --- RabbitMQ Worker ---
def callback(ch, method, properties, body):
    data = json.loads(body)
    evidence_id = data.get('objectName')
    bucket = data.get('bucket', 'forensics-evidence')
    
    print(f"📥 Processing: {evidence_id}")

    try:
        # Update Status -> PROCESSING
        reports_collection.update_one({"evidence_id": evidence_id}, {"$set": {"status": "PROCESSING"}})

        # Run Real AI
        result = analyze_log_file(bucket, evidence_id)

        if result:
            # Update Status -> COMPLETED
            reports_collection.update_one(
                {"evidence_id": evidence_id},
                {"$set": {
                    "status": "COMPLETED",
                    "anomalies_found": result['anomalies'],
                    "risk_score": result['risk_score'],
                    "ai_summary": result['summary'],
                    "plot_data": result['plot_data'] # Save the graph points!
                }}
            )
            print(f"✅ Finished: {evidence_id} - Risk: {result['risk_score']}")
        else:
             reports_collection.update_one({"evidence_id": evidence_id}, {"$set": {"status": "FAILED"}})

    except Exception as e:
        print(f"❌ Worker Error: {e}")
        reports_collection.update_one({"evidence_id": evidence_id}, {"$set": {"status": "FAILED"}})

    ch.basic_ack(delivery_tag=method.delivery_tag)

def start_worker():
    connection = pika.BlockingConnection(pika.URLParameters(RABBIT_URI))
    channel = connection.channel()
    channel.queue_declare(queue='forensics_tasks', durable=True)
    print('🐰 Neural Engine Online. Waiting for logs...')
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='forensics_tasks', on_message_callback=callback)
    channel.start_consuming()

if __name__ == '__main__':
    try: start_worker()
    except KeyboardInterrupt: sys.exit(0)