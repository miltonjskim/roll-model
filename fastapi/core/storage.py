"""
MinIO 객체 스토리지 서비스 클라이언트 모듈
: MinIO 객체 스토리지 서비스와의 상호작용을 위한 인터페이스를 제공

주요 기능:
- MinIO 서버 연결 및 클라이언트 초기화
- 버킷 생성 및 존재 여부 확인
- 파일 업로드/다운로드 기능
- 임시 URL 생성
- 파일 삭제

싱글톤 패턴을 사용 -> 애플리케이션 전체에서 하나의 MinIO 클라이언트 인스턴스를 공유
실제 MinIO 서버 정보는 settings 객체를 통해 설정 파일 또는 환경 변수에서 가져옴
"""
from io import BytesIO

from minio import Minio
from minio.select import SelectRequest, CSVInputSerialization, CSVOutputSerialization
from minio.error import S3Error
from fastapi import HTTPException
from typing import Optional, BinaryIO, Any, Dict, List
from datetime import timedelta
import io
import logging
import os
import pandas as pd

from core.config import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()

class MinioClient:
    def __init__(self):
        """MinIO 클라이언트 초기화"""
        try:
            self.client = Minio(
                endpoint=settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE,  # SSL 사용 여부
            )
            logger.info("MinIO 클라이언트가 성공적으로 초기화되었습니다.")
        except Exception as e:
            logger.error(f"MinIO 클라이언트 초기화 실패: {str(e)}")
            raise HTTPException(status_code=500, detail="스토리지 서비스 연결 실패")

    def check_bucket_exists(self, bucket_name: str) -> bool:
        """지정된 버킷이 존재하는지 확인"""
        try:
            return self.client.bucket_exists(bucket_name)
        except S3Error as e:
            logger.error(f"버킷 존재 여부 확인 중 오류: {str(e)}")
            return False

    def create_bucket_if_not_exists(self, bucket_name: str) -> bool:
        """버킷이 존재하지 않으면 생성"""
        try:
            if not self.check_bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"버킷 '{bucket_name}'이 성공적으로 생성되었습니다.")
            return True
        except S3Error as e:
            logger.error(f"버킷 '{bucket_name}' 생성 중 오류: {str(e)}")
            return False

    async def upload_file(
            self,
            bucket_name: str,
            object_name: str,
            file_data: BinaryIO,
            content_type: Optional[str] = None,
            encoding: Optional[str] = "utf-8"
    ) -> bool:
        """파일을 MinIO에 업로드"""
        try:
            # 버킷이 존재하는지 확인하고 없으면 생성
            self.create_bucket_if_not_exists(bucket_name)

            # 파일 크기 계산
            file_data.seek(0, os.SEEK_END)
            file_size = file_data.tell()
            file_data.seek(0)

            # 디버깅: 파일 데이터와 크기 출력
            file_data.seek(0)  # 포인터를 다시 처음으로 이동

            # 파일 업로드
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_data,
                length=file_size,
                content_type=content_type,
                metadata={"encoding": encoding}  # 메타데이터 추가
            )
            # file_data.close() 호출을 제거 - 호출자가 파일을 닫도록 함

            # 디버깅: 업로드 결과 출력 - result 변수 삭제 또는 수정
            # print(f"디버깅: 업로드 성공")
            # print(f"디버깅: 업로드된 파일 정보 - 버킷: {bucket_name}, 객체명: {object_name}")

            # 업로드 후 파일이 실제로 존재하는지 확인
            try:
                stat = self.client.stat_object(bucket_name, object_name)
                logger.info(f"파일 '{object_name}'이 버킷 '{bucket_name}'에 성공적으로 업로드되었습니다.")
                return True
            except Exception as stat_err:
                return False
        except S3Error as e:
            logger.error(f"파일 '{object_name}' 업로드 중 오류: {str(e)}")
            return False

    def get_file(self, bucket_name: str, object_name: str) -> Optional[bytes]:
        """MinIO에서 파일 다운로드"""
        try:
            response = self.client.get_object(bucket_name, object_name)
            data = response.read()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"파일 '{object_name}' 다운로드 중 오류: {str(e)}")
            return None

    def get_metadata(self, bucket_name: str, object_name: str) -> Optional[Dict[str, Any]]:
        try:
            obj_info = self.client.stat_object(bucket_name, object_name)

            metadata = {
                'size': obj_info.size,
                'content_type': obj_info.content_type,
                'etag': obj_info.etag,
                'last_modified': obj_info.last_modified,
                'metadata': obj_info.metadata,
                'version_id': obj_info.version_id
            }

            return metadata
        except S3Error as e:
            logger.error(f"파일 '{object_name}' 메타데이터 호출 중 오류: {str(e)}")
            return None

    def get_file_url(self, bucket_name: str, object_name: str, expires=timedelta(hours=1)) -> Optional[str]:
        """파일에 대한 임시 URL 생성"""
        try:
            # 파일이 실제로 존재하는지 확인
            try:
                stat = self.client.stat_object(bucket_name, object_name)
                print(f"디버깅: URL 생성 전 파일 상태: {stat.__dict__}")
            except Exception as stat_err:
                print(f"디버깅: URL 생성 전 파일이 존재하지 않음: {str(stat_err)}")

            url = self.client.presigned_get_object(
                bucket_name=bucket_name,
                object_name=object_name,
                expires=expires
            )
            print(f"디버깅: 생성된 URL: {url}")

            return url
        except S3Error as e:
            logger.error(f"파일 '{object_name}'의 URL 생성 중 오류: {str(e)}")
            print(f"디버깅: URL 생성 중 오류: {str(e)}")
            return None

    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        """MinIO에서 파일 삭제"""
        try:
            self.client.remove_object(bucket_name, object_name)
            logger.info(f"파일 '{object_name}'이 버킷 '{bucket_name}'에서 성공적으로 삭제되었습니다.")
            return True
        except S3Error as e:
            logger.error(f"파일 '{object_name}' 삭제 중 오류: {str(e)}")
            return False

    async def save_object_with_etag(self, bucket_name: str, object_name: str, data: BinaryIO, content_type: str, encoding: str) -> \
            Optional[str]:
        """객체를 저장하고 생성된 etag를 반환합니다."""
        try:

            # 버퍼 크기 계산
            current_position = data.tell()
            data.seek(0, 2)  # 끝으로 이동
            size = data.tell()  # 크기 확인
            data.seek(0)  # 처음으로 돌아감

            logger.info(f"데이터 버퍼 크기: {size} 바이트")

            # 버킷이 없으면 생성
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)

            # 객체 업로드 (명시적 크기 지정)
            result = self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=data,
                length=size,  # 명시적 크기 지정
                content_type=content_type,
                metadata={"encoding": encoding}
            )
            # etag 반환 (따옴표 제거)
            return result.etag.strip('"')

        except S3Error as err:
            print(f"S3 Error: {err}")
            return None
        except Exception as err:
            print(f"Error: {err}")
            return None

# 싱글톤 인스턴스 생성
minio_client = None


def get_minio_client() -> MinioClient:
    """MinIO 클라이언트 싱글톤 인스턴스 반환"""
    global minio_client
    if minio_client is None:
        minio_client = MinioClient()
    return minio_client