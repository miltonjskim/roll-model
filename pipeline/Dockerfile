# Python 3.10 + CUDA 11.8 이미지 사용
FROM superlinear/python-gpu:3.10-cuda11.8

WORKDIR /app

# NVIDIA 런타임 환경변수 설정
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV CUDA_VISIBLE_DEVICES=0

# 필요한 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kubernetes 클라이언트 설치 (kubectl)
RUN apt-get update && apt-get install -y apt-transport-https gnupg curl && \
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list && \
    apt-get update && apt-get install -y kubectl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# jq 설치 (JSON 처리용)
RUN apt-get update && apt-get install -y jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 애플리케이션 코드 복사
COPY *.py .
COPY mlflow-inferenceservice_template.yaml.j2 .

# .env 파일 복사
COPY .env .

# 모델 저장 디렉토리 생성
RUN mkdir -p /app/models

# 실행 명령
CMD ["python", "kafka_consumer.py"]