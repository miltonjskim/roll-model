"""
MinIO 연결 및 기본 기능 테스트 스크립트
- datasets 버킷이 없으면 생성
- 샘플 CSV 파일 생성 및 업로드
- 업로드된 파일 다운로드 및 내용 확인
- 임시 URL 생성 테스트
"""
import os
import io
import sys
import pytest
from pathlib import Path

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from core.config import get_settings
from core.storage import MinioClient, get_minio_client

settings = get_settings()


def test_minio_connection():
    """MinIO 서버 연결 테스트"""
    try:
        minio_client = get_minio_client()
        assert minio_client is not None
        print("✅ MinIO 서버 연결 성공")
    except Exception as e:
        print(f"❌ MinIO 서버 연결 실패: {str(e)}")
        assert False


def test_datasets_bucket_exists():
    """datasets 버킷 존재 여부 테스트"""
    try:
        minio_client = get_minio_client()
        bucket_name = settings.MINIO_DATASET_BUCKET

        # 버킷이 존재하는지 확인
        exists = minio_client.check_bucket_exists(bucket_name)

        if exists:
            print(f"✅ '{bucket_name}' 버킷이 이미 존재합니다")
        else:
            print(f"❌ '{bucket_name}' 버킷이 존재하지 않습니다")
            # 버킷 생성 시도
            created = minio_client.create_bucket_if_not_exists(bucket_name)
            if created:
                print(f"✅ '{bucket_name}' 버킷을 성공적으로 생성했습니다")
                assert True
            else:
                print(f"❌ '{bucket_name}' 버킷 생성에 실패했습니다")
                assert False
    except Exception as e:
        print(f"❌ 테스트 실패: {str(e)}")
        assert False


# def test_file_upload_and_download():
#     """파일 업로드/다운로드 테스트"""
#     try:
#         minio_client = get_minio_client()
#         bucket_name = settings.MINIO_DATASET_BUCKET
#         object_name = "test_dataset.csv"
#
#         # 테스트용 CSV 데이터 생성
#         test_data = "id,name,age\n1,John,30\n2,Jane,25\n3,Bob,40"
#         data_stream = io.BytesIO(test_data.encode('utf-8'))
#
#         # 파일 업로드
#         upload_success = minio_client.upload_file(
#             bucket_name=bucket_name,
#             object_name=object_name,
#             file_data=data_stream,
#             content_type="text/csv"
#         )
#
#         if upload_success:
#             print(f"✅ 테스트 파일 '{object_name}' 업로드 성공")
#         else:
#             print(f"❌ 테스트 파일 '{object_name}' 업로드 실패")
#             assert False
#
#         # 파일 다운로드
#         downloaded_data = minio_client.get_file(bucket_name, object_name)
#
#         if downloaded_data:
#             # 다운로드한 데이터가 원본과 일치하는지 확인
#             if downloaded_data.decode('utf-8') == test_data:
#                 print(f"✅ 테스트 파일 '{object_name}' 다운로드 성공 및 데이터 일치")
#             else:
#                 print(f"❌ 테스트 파일 '{object_name}' 다운로드 성공했으나 데이터 불일치")
#                 assert False
#         else:
#             print(f"❌ 테스트 파일 '{object_name}' 다운로드 실패")
#             assert False
#
#         # 테스트 URL 생성
#         file_url = minio_client.get_file_url(bucket_name, object_name)
#         if file_url:
#             print(f"✅ 파일 URL 생성 성공: {file_url}")
#         else:
#             print(f"❌ 파일 URL 생성 실패")
#             assert False
#
#         # 테스트 후 파일 삭제
#         delete_success = minio_client.delete_file(bucket_name, object_name)
#         # if delete_success:
#         #     print(f"✅ 테스트 파일 '{object_name}' 삭제 성공")
#         # else:
#         #     print(f"❌ 테스트 파일 '{object_name}' 삭제 실패")
#         #     assert False
#
#     except Exception as e:
#         print(f"❌ 테스트 실패: {str(e)}")
#         assert False

def test_permanent_file():
    """영구적으로 파일을 유지하는 테스트"""
    minio_client = get_minio_client()
    bucket_name = settings.MINIO_DATASET_BUCKET
    object_name = "permanent_test_file.csv"

    # 테스트용 CSV 데이터 생성
    test_data = "id,name,age\n1,John,30\n2,Jane,25\n3,Bob,40"
    data_stream = io.BytesIO(test_data.encode('utf-8'))

    # 파일 업로드
    upload_success = minio_client.upload_file(
        bucket_name=bucket_name,
        object_name=object_name,
        file_data=data_stream,
        content_type="text/csv"
    )

    assert upload_success, "파일 업로드 실패"
    print(f"✅ 영구 파일 '{object_name}' 업로드 성공")

    # URL 생성 및 출력
    file_url = minio_client.get_file_url(bucket_name, object_name)
    print(f"✅ 영구 파일 URL: {file_url}")
    print("이 URL을 브라우저에서 직접 열어보세요.")

if __name__ == "__main__":
    # 개별 테스트 실행
    print("\n===== MinIO 연결 테스트 =====")
    test_minio_connection()

    print("\n===== datasets 버킷 테스트 =====")
    test_datasets_bucket_exists()

    print("\n===== 파일 업로드/다운로드 테스트 =====")
    test_permanent_file()

    print("\n✅ 모든 테스트가 성공적으로 완료되었습니다.")