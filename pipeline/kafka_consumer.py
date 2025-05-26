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
                required_fields = ['model_type', 'train_data_path', 'project_id', 'member_id', 'pipeline_id']
                missing_fields = [field for field in required_fields if field not in payload]

                if missing_fields:
                    print(f"[Consumer] Invalid message: missing fields: {', '.join(missing_fields)}")
                    continue

                # 데이터 경로 처리 - 원래 경로 그대로 유지
                data_path = payload['train_data_path']
                print(f"[Consumer] Original data path: {data_path}")

                model_type = payload['model_type']
                model_params = payload.get('parameters', {})

                # 프로젝트 및 멤버 정보
                project_id = payload.get('project_id')
                member_id = payload.get('member_id')
                pipeline_id = payload.get('pipeline_id')

                # 저장 경로 (선택적)
                save_path = payload.get('save_path')

                # 타겟 컬럼 설정
                target_column = payload.get('target_column', DEFAULT_TARGET_COLUMN)

                print(f"[Consumer] Processing - Model: {model_type}, Data: {data_path}")
                print(f"[Consumer] Parameters: {model_params}")
                print(f"[Consumer] Project ID: {project_id}, Member ID: {member_id}")
                print(f"[Consumer] Pipeline ID: {pipeline_id}")
                print(f"[Consumer] Target column: {target_column}")

                # Celery 태스크 제출
                task = train_model_task.delay(
                    data_path,
                    model_type,
                    model_params,
                    save_path,
                    target_column,
                    pipeline_id,
                    project_id,
                    member_id
                )
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