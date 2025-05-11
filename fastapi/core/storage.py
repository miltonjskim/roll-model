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

    def upload_file(
            self,
            bucket_name: str,
            object_name: str,
            file_data: BinaryIO,
            content_type: Optional[str] = None
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
            print(f"디버깅: 업로드 파일 크기: {file_size} 바이트")
            print(f"디버깅: 파일 내용 샘플: {file_data.read(100)}")  # 처음 100바이트만 출력
            file_data.seek(0)  # 포인터를 다시 처음으로 이동

            # 파일 업로드
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_data,
                length=file_size,
                content_type=content_type
            )
            # file_data.close() 호출을 제거 - 호출자가 파일을 닫도록 함

            # 디버깅: 업로드 결과 출력 - result 변수 삭제 또는 수정
            print(f"디버깅: 업로드 성공")
            print(f"디버깅: 업로드된 파일 정보 - 버킷: {bucket_name}, 객체명: {object_name}")

            # 업로드 후 파일이 실제로 존재하는지 확인
            try:
                stat = self.client.stat_object(bucket_name, object_name)
                print(f"디버깅: 업로드된 파일 상태: {stat.__dict__}")
                logger.info(f"파일 '{object_name}'이 버킷 '{bucket_name}'에 성공적으로 업로드되었습니다.")
                return True
            except Exception as stat_err:
                print(f"디버깅: 파일 상태 확인 실패: {str(stat_err)}")
                return False
        except S3Error as e:
            logger.error(f"파일 '{object_name}' 업로드 중 오류: {str(e)}")
            print(f"디버깅: S3 오류 발생: {str(e)}")
            return False

    def get_file(self, bucket_name: str, object_name: str) -> Optional[bytes]:
        """MinIO에서 파일 다운로드"""
        try:
            response = self.client.get_object(bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"파일 '{object_name}' 다운로드 중 오류: {str(e)}")
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

    async def save_object_with_etag(self, bucket_name: str, object_name: str, data: BinaryIO, content_type: str) -> \
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
                content_type=content_type
            )
            logger.info(f"minio 저장 결과값 : {result}")
            # etag 반환 (따옴표 제거)
            return result.etag.strip('"')

        except S3Error as err:
            print(f"S3 Error: {err}")
            return None
        except Exception as err:
            print(f"Error: {err}")
            return None

    async def query_csv_with_paging(
            self,
            bucket_name: str,
            object_name: str,
            page: int = 1,
            page_size: int = 10,
            last_idx: int = None,  # 이전 페이지의 마지막 idx 값
            filter_condition: str = None,
    ) -> Dict[str, Any]:
        """
        CSV 파일에 페이징 쿼리 실행
        idx 컬럼이 있으면 페이징 처리, 없으면 모든 데이터 반환

        Args:
            bucket_name: 버킷 이름
            object_name: 객체 이름 (CSV 파일 경로)
            page: 페이지 번호 (1부터 시작)
            page_size: 페이지 크기
            last_idx: 이전 페이지의 마지막 idx 값 (다음 페이지 조회 시 사용)
            filter_condition: SQL WHERE 절 조건 (예: "age > 30")

        Returns:
            Dictionary containing:
            - data: 페이지 데이터 (리스트)
            - total: 전체 레코드 수
            - page: 현재 페이지
            - page_size: 페이지 크기
            - total_pages: 전체 페이지 수
            - last_idx: 현재 페이지의 마지막 idx 값 (다음 페이지 조회 시 사용)
        """
        try:
            # 먼저 CSV 컬럼 확인
            columns = await self.get_csv_columns(bucket_name, object_name)
            logger.info(f"CSV 컬럼: {columns}")
            has_idx_column = 'idx' in columns
            logger.info(f"page: {page}, page_size: {page_size}, last_idx: {last_idx}, filter_condition: {filter_condition}")
            # CSV 입력/출력 직렬화 설정
            csv_input = CSVInputSerialization(
                compression_type="NONE",
                file_header_info="USE",
                record_delimiter="\n",
                field_delimiter=",",
                quote_character='"',
                quote_escape_character='"',
                comments="#",
                allow_quoted_record_delimiter=False
            )

            csv_output = CSVOutputSerialization(
                record_delimiter="\n",
                field_delimiter=",",
                quote_character='"',
                quote_escape_character='"'
            )

            # 총 레코드 수 계산
            count_query = "SELECT COUNT(*) FROM S3Object"
            if filter_condition:
                count_query += f" WHERE {filter_condition}"

            count_request = SelectRequest(
                count_query,
                input_serialization=csv_input,
                output_serialization=csv_output
            )

            count_response = self.client.select_object_content(
                bucket_name,
                object_name,
                count_request
            )

            count_data = ""
            for d in count_response.stream():
                count_data += d.decode('utf-8')
                # print(count_data)

            total_records = int(count_data.split('\n')[0])
            count_response.stream().close()

            # SQL 쿼리 구성
            sql_query = "SELECT * FROM S3Object"
            where_conditions = []

            if has_idx_column:
                # idx 컬럼이 있는 경우
                # 다음 페이지 조회: 이전 페이지의 마지막 idx 이후부터
                where_conditions.append(f"idx > {page_size * (page - 1)}")

                # 추가 필터 조건이 있으면 추가
                if filter_condition:
                    where_conditions.append(f"({filter_condition})")

                # WHERE 절 추가
                if where_conditions:
                    sql_query += " WHERE " + " AND ".join(where_conditions)

                # 페이지 크기만큼 제한
                sql_query += f" LIMIT {page_size}"

                total_pages = (total_records + page_size - 1) // page_size
                current_page = page
            else:
                # idx 컬럼이 없는 경우, 전체 데이터 반환
                if filter_condition:
                    sql_query += f" WHERE {filter_condition}"

                total_pages = 1
                current_page = 1

            # Select 쿼리 실행
            select_request = SelectRequest(
                sql_query,
                input_serialization=csv_input,
                output_serialization=csv_output
            )

            response = self.client.select_object_content(
                bucket_name,
                object_name,
                select_request
            )

            data = b""
            for d in response.stream():
                data += d
                # print(data)

            # 데이터 처리
            records = []
            new_last_idx = last_idx

            if data:
                df = pd.read_csv(BytesIO(data), encoding='utf-8', header=None)
                # 컬럼명을 수동으로 설정
                df.columns = columns
                logger.info(f"CSV 데이터 조회 성공: {df}")
                if not df.empty and has_idx_column:
                    # 현재 페이지의 마지막 idx 값 저장
                    new_last_idx = df['idx'].max()

                records = df.to_dict('records')

            return {
                "data": records,
                "total": total_records,
                "page": current_page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_idx_column": has_idx_column,
                "last_idx": new_last_idx  # 다음 페이지 조회 시 사용할 마지막 idx 값
            }

        except Exception as e:
            raise Exception(f"CSV 파일 쿼리 중 오류 발생: {str(e)}")

    async def get_csv_columns(self, bucket_name: str, object_name: str) -> List[str]:
        """CSV 파일의 컬럼 목록 가져오기"""
        try:
            # 컬럼만 가져오기 위한 쿼리
            sql_query = "SELECT * FROM S3Object LIMIT 3"

            csv_input = CSVInputSerialization(
                compression_type="NONE",
                file_header_info="NONE",
                record_delimiter="\n",
                field_delimiter=",",
                quote_character='"',
                quote_escape_character='"'
            )

            csv_output = CSVOutputSerialization(
                record_delimiter="\n",
                field_delimiter=",",
                quote_character='"',
                quote_escape_character='"'
            )

            select_request = SelectRequest(
                sql_query,
                input_serialization=csv_input,
                output_serialization=csv_output
            )

            response = self.client.select_object_content(
                bucket_name,
                object_name,
                select_request
            )

            data = b""
            for d in response.stream():
                data += d
                # print(data)
            # 데이터프레임으로 변환하여 컬럼 추출
            if data:
                df = pd.read_csv(BytesIO(data), encoding='utf-8')
                response.stream().close()
                return df.columns.tolist()
            else:
                return []

        except Exception as e:
            raise Exception(f"CSV 컬럼 가져오기 중 오류 발생: {str(e)}")
def test_file_persistence():
    """파일이 실제로 MinIO에 유지되는지 테스트"""
    try:
        minio_client = get_minio_client()
        bucket_name = settings.MINIO_DATASET_BUCKET
        object_name = "persistent_test.csv"

        # 테스트용 CSV 데이터 생성
        test_data = "id,name,age\n1,John,30\n2,Jane,25\n3,Bob,40"
        data_stream = io.BytesIO(test_data.encode('utf-8'))

        # 파일 업로드
        print("\n업로드 테스트 시작")
        upload_success = minio_client.upload_file(
            bucket_name=bucket_name,
            object_name=object_name,
            file_data=data_stream,
            content_type="text/csv"
        )

        data_stream.close()

        assert upload_success, "파일 업로드 실패"
        print(f"✅ 테스트 파일 '{object_name}' 업로드 성공")

        # 파일이 실제로 존재하는지 확인
        print("\n파일 존재 여부 직접 확인")
        try:
            stat = minio_client.client.stat_object(bucket_name, object_name)
            print(f"✅ 파일이 실제로 존재함: {stat.object_name}, 크기: {stat.size}")
            assert True
        except Exception as e:
            print(f"❌ 파일이 존재하지 않음: {str(e)}")
            assert False

        # URL 생성
        file_url = minio_client.get_file_url(bucket_name, object_name)
        print(f"생성된 URL: {file_url}")

        # 다운로드 테스트 - 다른 방식으로
        print("\n다운로드 테스트")
        try:
            response = minio_client.client.get_object(bucket_name, object_name)
            data = response.read()
            print(f"✅ 다운로드한 데이터 크기: {len(data)} 바이트")
            print(f"✅ 다운로드한 데이터 내용: {data.decode('utf-8')}")
            response.close()
            response.release_conn()
        except Exception as e:
            print(f"❌ 다운로드 실패: {str(e)}")
            assert False

        # 파일 삭제하지 않고 유지
        print("\n테스트 완료: 파일은 삭제하지 않고 유지됨")

    except Exception as e:
        print(f"❌ 테스트 실패: {str(e)}")
        assert False

# 싱글톤 인스턴스 생성
minio_client = None


def get_minio_client() -> MinioClient:
    """MinIO 클라이언트 싱글톤 인스턴스 반환"""
    global minio_client
    if minio_client is None:
        minio_client = MinioClient()
    return minio_client