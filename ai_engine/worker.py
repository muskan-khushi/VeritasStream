import pika
import json
import time
import os
import sys
import numpy as np
from pymongo import MongoClient
from minio import Minio
from dotenv import load_dotenv
from sklearn.ensemble import IsolationForest
from gtts import gTTS

load_dotenv()

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
reports_collection = db.reports 

print("⏳ Connecting to MinIO...")
minio_client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS, secret_key=MINIO_SECRET, secure=False)

# --- HELPER: VOICE GENERATOR (gTTS) ---
def generate_voice_alert(text, case_id):
    try:
        print("🗣️ Generating Voice Alert...")
        # Sanitize filename for local saving
        safe_filename = case_id.replace("/", "_").replace("\\", "_")
        local_filename = f"{safe_filename}_alert.mp3"
        
        tts = gTTS(text=text, lang='en', tld='co.uk')
        tts.save(local_filename)
        
        # Upload to MinIO
        minio_path = f"audio/{local_filename}"
        minio_client.fput_object("forensics-evidence", minio_path, local_filename)
        
        os.remove(local_filename)
        return minio_path
    except Exception as e:
        print(f"❌ Voice Error: {e}")
        return None

# --- ANALYSIS ENGINE ---
def analyze_log_file(bucket, object_name):
    print(f"🧠 Analyzing: {object_name}")
    
    try:
        response = minio_client.get_object(bucket, object_name)
        content_str = response.read().decode('utf-8', errors='ignore')
        lines = content_str.splitlines()
        response.close()
        response.release_conn()
    except Exception as e:
        print(f"❌ MinIO Error: {e}")
        return None

    if len(lines) < 2:
        return None

    # 1. Logic / ML Analysis
    anomalies_count = 0 
    risk_score = 0
    
    # Simple Demo Logic (Force Risk for specific keywords)
    content_lower = content_str.lower()
    attack_type = "Normal Activity"
    summary = "Routine logs."
    action = "None."

    if "locked" in content_lower or "encrypt" in content_lower:
        attack_type = "Ransomware"
        summary = "Critical encryption events detected."
        action = "Isolate host immediately."
        risk_score = 95
        anomalies_count = 500
    elif "union select" in content_lower:
        attack_type = "SQL Injection"
        summary = "Database exfiltration attempt."
        action = "Block IP."
        risk_score = 88
        anomalies_count = 120
    elif "failed" in content_lower:
        risk_score = 45
        attack_type = "Authentication Failure"
        summary = "Multiple failed logins."
        action = "Check Active Directory."
    
    # 2. Voice Generation
    audio_url = None
    if risk_score > 40:
        voice_text = f"Veritas Alert. {attack_type} detected. {summary} Recommended action: {action}"
        audio_url = generate_voice_alert(voice_text, object_name)

    return {
        "anomalies": anomalies_count,
        "risk_score": risk_score,
        "summary": summary,
        "attack_type": attack_type,
        "recommended_action": action,
        "audio_url": audio_url,
        "plot_data": [{"line": i, "risk": risk_score} for i in range(10)] # Dummy plot data
    }

# --- RABBITMQ CALLBACK ---
def callback(ch, method, properties, body):
    data = json.loads(body)
    full_path = data.get('objectName')
    bucket = data.get('bucket', 'forensics-evidence')
    
    print(f"📥 Processing: {full_path}")

    try:
        # Run Analysis
        result = analyze_log_file(bucket, full_path)

        if result:
            print(f"✅ Analysis Done. Risk: {result['risk_score']}%")
            
            # CRITICAL UPDATE STEP
            update_result = reports_collection.update_one(
                {"evidence_id": full_path},
                {"$set": {
                    "status": "COMPLETED",
                    "anomalies_found": result['anomalies'],
                    "risk_score": result['risk_score'],
                    "ai_summary": result['summary'],
                    "attack_type": result['attack_type'],
                    "recommended_action": result['recommended_action'],
                    "audio_url": result['audio_url'],
                    "plot_data": result['plot_data']
                }}
            )
            
            if update_result.modified_count > 0:
                print(f"🎉 Database Updated Successfully!")
            else:
                print(f"⚠️ WARNING: No DB record found for {full_path}")
        else:
            print("❌ Analysis Failed (File empty or error)")

    except Exception as e:
        print(f"❌ Worker Error: {e}")

    ch.basic_ack(delivery_tag=method.delivery_tag)

def start_worker():
    connection = pika.BlockingConnection(pika.URLParameters(RABBIT_URI))
    channel = connection.channel()
    channel.queue_declare(queue='forensics_tasks', durable=True)
    print('🐰 Veritas Engine Online. Waiting...')
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='forensics_tasks', on_message_callback=callback)
    channel.start_consuming()

if __name__ == '__main__':
    try: start_worker()
    except KeyboardInterrupt: sys.exit(0)