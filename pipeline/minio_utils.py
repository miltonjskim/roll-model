from minio import Minio
from minio.error import S3Error
import os
import io
from config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_SECURE,
    MINIO_MODELS_BUCKET,
    MINIO_DATASETS_BUCKET
)

# MinIO 클라이언트 초기화
client = Minio(
    endpoint=MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)


def ensure_bucket_exists(bucket_name):
    """지정된 버킷이 존재하는지 확인하고, 없으면 생성합니다."""
    try:
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            print(f"버킷 '{bucket_name}'을 생성했습니다.")
        return True
    except S3Error as e:
        print(f"버킷 확인 중 오류 발생: {e}")
        return False


def upload_model(data, object_name, bucket_name=MINIO_MODELS_BUCKET, content_type='application/octet-stream'):
    """모델 데이터를 MinIO에 업로드합니다."""
    try:
        ensure_bucket_exists(bucket_name)
        client.put_object(
            bucket_name=bucket_name,
            object_name=object_name,
            data=io.BytesIO(data),
            length=len(data),
            content_type=content_type
        )
        print(f"모델이 '{bucket_name}' 버킷에 '{object_name}'으로 업로드되었습니다.")
        return f"s3://{bucket_name}/{object_name}"
    except S3Error as e:
        print(f"모델 업로드 중 오류 발생: {e}")
        return None


def download_dataset(object_name, file_path, bucket_name=MINIO_DATASETS_BUCKET):
    """MinIO에서 데이터셋을 다운로드합니다."""
    try:
        # 디렉토리가 없으면 생성
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        client.fget_object(
            bucket_name=bucket_name,
            object_name=object_name,
            file_path=file_path
        )
        print(f"'{bucket_name}' 버킷에서 '{object_name}'을(를) '{file_path}'로 다운로드했습니다.")
        return file_path
    except S3Error as e:
        print(f"데이터셋 다운로드 중 오류 발생: {e}")
        return None


def get_file_url(object_name, bucket_name, expires=7 * 24 * 60 * 60):
    """MinIO에서 파일에 접근하기 위한 URL을 생성합니다."""
    try:
        url = client.presigned_get_object(
            bucket_name=bucket_name,
            object_name=object_name,
            expires=expires
        )
        return url
    except S3Error as e:
        print(f"URL 생성 중 오류 발생: {e}")
        return None


def parse_s3_url(s3_url):
    """S3 URL을 버킷 이름과 객체 이름으로 파싱합니다."""
    # s3://bucket-name/object-name 형식 파싱
    if not s3_url.startswith('s3://'):
        raise ValueError(f"유효한 S3 URL 형식이 아닙니다: {s3_url}")

    parts = s3_url[5:].split('/', 1)  # s3:// 제거 후 첫 번째 / 에서 분할
    if len(parts) != 2:
        raise ValueError(f"유효한 S3 URL 형식이 아닙니다: {s3_url}")

    bucket_name = parts[0]
    object_name = parts[1]
    return bucket_name, object_name