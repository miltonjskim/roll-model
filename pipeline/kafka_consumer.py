from confluent_kafka import Consumer
import json
from celery_worker import train_model_task
import os
from config import (
    KAFKA_CONSUMER_CONFIG,
    KAFKA_TOPIC,
    get_absolute_path,
    DEFAULT_TARGET_COLUMN
)

def consume_and_submit_tasks():
    # Kafka Consumer
    consumer = Consumer(KAFKA_CONSUMER_CONFIG)
    consumer.subscribe([KAFKA_TOPIC])

    print(f"[Consumer] Kafka consumer started, waiting for messages on topic '{KAFKA_TOPIC}'...")
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                print(f"[Consumer] Error: {msg.error()}")
                continue

            try:
                payload = json.loads(msg.value().decode('utf-8'))
                print(f"[Consumer] Received message: {payload}")

                # 필수 필드 확인
                if 'data_path' not in payload:
                    print(f"[Consumer] Invalid message: missing 'data_path' field")
                    continue

                # 경로 처리
                data_path = get_absolute_path(payload['data_path'])
                model_params = payload.get('model_params', {})
                save_path = get_absolute_path(payload.get('save_path'))
                # 타겟 컬럼 설정
                target_column = payload.get('target_column', DEFAULT_TARGET_COLUMN)

                print(f"[Consumer] Resolved paths - data: {data_path}, save: {save_path}")
                print(f"[Consumer] Target column: {target_column}")

                # Celery 태스크 제출
                task = train_model_task.delay(data_path, model_params, save_path, target_column)
                print(f"[Consumer] Submitted Celery task with ID: {task.id}")

            except json.JSONDecodeError:
                print(f"[Consumer] Error: Failed to parse message as JSON")
            except Exception as e:
                print(f"[Consumer] Error processing message: {e}")

    except KeyboardInterrupt:
        print("[Consumer] Shutting down consumer...")
    finally:
        consumer.close()
        print("[Consumer] Consumer closed")


if __name__ == '__main__':
    consume_and_submit_tasks()