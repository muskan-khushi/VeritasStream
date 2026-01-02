import pika
import json
import os
import time
import logging
from minio import Minio
from pymongo import MongoClient

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('ai_worker')

def connect_rabbitmq():
    while True:
        try:
            credentials = pika.PlainCredentials(os.environ.get('RABBITMQ_USER'), os.environ.get('RABBITMQ_PASS'))
            parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
            connection = pika.BlockingConnection(parameters)
            return connection
        except pika.exceptions.AMQPConnectionError:
            logger.error("RabbitMQ not ready... retrying in 5s")
            time.sleep(5)

def process_task(ch, method, properties, body):
    data = json.loads(body)
    case_id = data.get('caseId', 'unknown')
    filename = data.get('originalName', 'unknown')
    
    logger.info(f"🚀 PROCESSING STARTED: Case {case_id} - File {filename}")
    
    # Simulate AI Processing time
    time.sleep(2)
    
    logger.info(f"✅ ANALYSIS COMPLETE: {filename}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    logger.info("AI Worker Starting...")
    
    # Connect to Storage
    minio_client = Minio(
        "minio:9000",
        access_key=os.environ.get('MINIO_ACCESS_KEY'),
        secret_key=os.environ.get('MINIO_SECRET_KEY'),
        secure=False
    )
    
    # Connect to Queue
    connection = connect_rabbitmq()
    channel = connection.channel()
    channel.queue_declare(
        queue='log_processing_task', 
        durable=True,
        arguments={'x-max-priority': 10}
    )    
    
    # Start Listening
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='log_processing_task', on_message_callback=process_task)
    
    logger.info("Waiting for forensic tasks...")
    channel.start_consuming()

if __name__ == '__main__':
    main()