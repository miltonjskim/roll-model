FROM python:3.11

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

# 의존성 설치
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 애플리케이션 코드 복사
COPY . /code/app

FROM python:3.11

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

# 의존성 설치
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 애플리케이션 코드 복사
COPY . /code/app

FROM python:3.11

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

# 의존성 설치
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 애플리케이션 코드 복사
COPY . /code/app

# Gunicorn으로 Uvicorn 실행
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:80"]