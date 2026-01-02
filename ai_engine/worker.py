import pika
import json
import os
import time
import logging
from minio import Minio
from pymongo import MongoClient
from parsers import LogParser
from anomaly import AnomalyDetector

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('ai_worker')

# Initialize Dependencies
mongo_client = MongoClient(os.environ.get('MONGO_URI'))
db = mongo_client.forensics

minio_client = Minio(
    "minio:9000",
    access_key=os.environ.get('MINIO_ACCESS_KEY'),
    secret_key=os.environ.get('MINIO_SECRET_KEY'),
    secure=False
)

parser = LogParser()
detector = AnomalyDetector()

def connect_rabbitmq():
    while True:
        try:
            credentials = pika.PlainCredentials(os.environ.get('RABBITMQ_USER'), os.environ.get('RABBITMQ_PASS'))
            parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
            return pika.BlockingConnection(parameters)
        except pika.exceptions.AMQPConnectionError:
            logger.error("RabbitMQ not ready... retrying in 5s")
            time.sleep(5)

def process_task(ch, method, properties, body):
    data = json.loads(body)
    case_id = data.get('caseId')
    object_name = data.get('objectName')
    bucket_name = data.get('bucket')
    
    logger.info(f"🚀 ANALYZING: {data.get('originalName')} (Case: {case_id})")

    try:
        # 1. Download File
        response = minio_client.get_object(bucket_name, object_name)
        content = response.read()
        response.close()
        response.release_conn()

        # 2. Parse & Feature Engineering
        structured_logs = parser.parse_content(content)
        logger.info(f"📊 Parsed {len(structured_logs)} log lines")

        # 3. AI Anomaly Detection
        analyzed_logs, anomaly_count = detector.analyze(structured_logs)
        logger.info(f"🧠 AI Detection Complete. Found {anomaly_count} Anomalies")

        # 4. Save Intelligence to Database
        report = {
            'case_id': case_id,
            'file_name': data.get('originalName'),
            'object_name': object_name,
            'uploaded_at': data.get('uploadedAt'),
            'analyzed_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_lines': len(structured_logs),
            'anomalies_found': anomaly_count,
            'risk_level': 'HIGH' if anomaly_count > 0 else 'LOW',
            'logs': analyzed_logs,  # Stores the full analysis
            'status': 'COMPLETED'
        }
        
        db.analysis_reports.insert_one(report)
        logger.info("💾 Report saved to MongoDB")

    except Exception as e:
        logger.error(f"❌ Analysis Failed: {str(e)}")
        # Optional: Save a 'FAILED' status to DB here

    ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    logger.info("VeritasStream AI Engine v1.0 [Online]")
    connection = connect_rabbitmq()
    channel = connection.channel()
    
    # Ensure queue matches Backend definition (Priority Queue)
    channel.queue_declare(
        queue='log_processing_task', 
        durable=True, 
        arguments={'x-max-priority': 10}
    )
    
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='log_processing_task', on_message_callback=process_task)
    
    logger.info("Waiting for forensic evidence...")
    channel.start_consuming()

if __name__ == '__main__':
    main()