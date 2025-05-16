FROM python:3.11

WORKDIR /code/app

COPY ./requirements.txt /code/app/requirements.txt

# 의존성 설치
RUN pip install --no-cache-dir --upgrade -r /code/app/requirements.txt

# 애플리케이션 코드 복사
COPY . /code/app

# Gunicorn으로 Uvicorn 실행
# 더 상세한 설정
CMD ["gunicorn", "main:app", \
     "-w", "4", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:80", \
     "--timeout", "300", \
     "--keep-alive", "2", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "50"]