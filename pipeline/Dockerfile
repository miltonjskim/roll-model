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

# curl 및 jq 설치 (필요한 도구)
RUN apt-get update && apt-get install -y curl jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# kubectl 설치 (K3s 버전과 일치)
RUN curl -LO "https://dl.k8s.io/release/v1.32.4/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# 애플리케이션 코드 복사
COPY *.py .
COPY templates/mlflow-inferenceservice_template.yaml.j2 .

# .env 파일 복사
COPY .env .

# 모델 저장 디렉토리 생성
RUN mkdir -p /app/models

# 실행 명령
CMD ["python", "kafka_consumer.py"]