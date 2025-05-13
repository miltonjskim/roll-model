import os
from dotenv import load_dotenv
import pathlib

# .env 파일 로드
env_path = pathlib.Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# 프로젝트 루트 경로
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

# RabbitMQ 설정
RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST')
RABBITMQ_PORT = os.environ.get('RABBITMQ_PORT')
RABBITMQ_USER = os.environ.get('RABBITMQ_USER')
RABBITMQ_PASSWORD = os.environ.get('RABBITMQ_PASSWORD')
RABBITMQ_VHOST = os.environ.get('RABBITMQ_VHOST')

# RabbitMQ 브로커 URL
RABBITMQ_BROKER_URL = f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST.strip('/')}"

# Kafka 설정
KAFKA_BOOTSTRAP_SERVERS = os.environ.get('KAFKA_BOOTSTRAP_SERVERS')
KAFKA_CONSUMER_GROUP = os.environ.get('KAFKA_CONSUMER_GROUP')
KAFKA_TOPIC = os.environ.get('KAFKA_TOPIC')
KAFKA_STATUS_TOPIC = os.environ.get('KAFKA_STATUS_TOPIC')

# 기본 설정 - 환경 변수에 없는 경우 기본값
DEFAULT_TARGET_COLUMN = os.environ.get('DEFAULT_TARGET_COLUMN', 'sentiment')
MODELS_DIR = os.environ.get('MODELS_DIR', '/tmp/models')

# Kafka 소비자 설정
KAFKA_CONSUMER_CONFIG = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'group.id': KAFKA_CONSUMER_GROUP,
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': True,
    'broker.address.family': 'v4'
}

# Kafka 생산자 설정
KAFKA_PRODUCER_CONFIG = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'num.partitions': 1
}

# MinIO 설정
MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT')
MINIO_ACCESS_KEY = os.environ.get('MINIO_ACCESS_KEY')
MINIO_SECRET_KEY = os.environ.get('MINIO_SECRET_KEY')
MINIO_SECURE = os.environ.get('MINIO_SECURE', 'False').lower() == 'true'
MINIO_MODELS_BUCKET = os.environ.get('MINIO_MODELS_BUCKET')
MINIO_DATASETS_BUCKET = os.environ.get('MINIO_DATASETS_BUCKET')
MINIO_ENDPOINT_G4DN = os.environ.get('MINIO_ENDPOINT_G4DN')
MINIO_ENDPOINT_G4DN_KUBE = os.environ.get('MINIO_ENDPOINT_G4DN_KUBE')

# MongoDB 설정
MONGODB_URI = os.environ.get('MONGODB_URI')
MONGODB_DATABASE = os.environ.get('MONGODB_DATABASE')
MONGODB_COLLECTION = os.environ.get('MONGODB_COLLECTION')

# MLflow 설정
MLFLOW_TRACKING_URI = os.environ.get('MLFLOW_TRACKING_URI')

def get_absolute_path(path):
    """상대 경로를 절대 경로로 변환"""
    if path is None:
        return None

    # S3 URL인 경우 그대로 반환
    if path.startswith('s3://'):
        return path

    # 이미 절대 경로인 경우
    if os.path.isabs(path) and not path.startswith('/'):
        return path

    # Unix 스타일 절대 경로 처리
    if path.startswith('/'):
        path = path.lstrip('/')

    # 프로젝트 루트 기준 상대 경로로 변환
    return os.path.join(PROJECT_ROOT, path)


def get_model_path(path=None):
    """모델 저장 경로 처리"""
    if path is None:
        # 기본 모델 경로 사용
        path = os.path.join(MODELS_DIR, 'model.pkl')

    # Windows 환경에서 /tmp 경로 처리
    if path.startswith('/tmp/'):
        # Windows 임시 폴더로 경로 변경
        tmp_dir = os.environ.get('TEMP') or os.environ.get('TMP') or 'C:/temp'
        path = os.path.join(tmp_dir, path[5:])  # '/tmp/' 부분 제거

    return path