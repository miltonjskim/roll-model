FROM python:3.13-slim

WORKDIR /app

# 필요한 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY config.py .
COPY celery_worker.py .
COPY kafka_consumer.py .

# .env 파일 복사
COPY .env .

# 모델 저장 디렉토리 생성
RUN mkdir -p /app/models

# 실행 명령
CMD ["python", "kafka_consumer.py"]