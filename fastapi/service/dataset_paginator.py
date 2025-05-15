import io
import pandas as pd
from typing import Dict, Any, Optional
import logging

from core.storage import MinioClient

logger = logging.getLogger()


class ChunkedCSVReader:
    def __init__(self, minio_client:MinioClient, bucket_name: str, object_name: str):
        self.minio_client:MinioClient = minio_client
        self.bucket_name = bucket_name
        self.object_name = object_name
        self.chunk_size = 1024 * 1024  # 1MB per chunk
        self.encoding = None
        self.headers = []
        self.has_idx_column = False
        self.file_size = None
        self._is_initialized = False

    async def _initialize_if_needed(self):
        """필요시 파일 정보를 초기화합니다"""
        if self._is_initialized:
            return

        # 파일 크기 확인
        stat = self.minio_client.client.stat_object(self.bucket_name, self.object_name)
        self.file_size = stat.size

        # 인코딩 설정
        await self._detect_encoding()

        # 헤더 정보 가져오기
        await self._get_headers()

        self._is_initialized = True

    async def _detect_encoding(self):
        """MinIO metadata에서 인코딩 정보를 가져오고, 없으면 기본값 사용"""
        try:
            self.encoding = "utf-8"

        except Exception as e:
            logger.warning(f"Error getting metadata: {e}")

        # metadata에서 가져오지 못한 경우 기본값 사용
        self.encoding = 'utf-8'  # 기본 인코딩
        logger.info(f"Using default encoding: {self.encoding}")

    async def _get_headers(self):
        """CSV 헤더를 가져옵니다"""
        response = self.minio_client.client.get_object(
            self.bucket_name,
            self.object_name,
            length=1024
        )
        first_chunk = response.read()

        first_line = first_chunk.split(b'\n')[0]
        header_str = first_line.decode(self.encoding)
        self.headers = [col.strip().strip('"') for col in header_str.split(',')]
        self.has_idx_column = 'idx' in self.headers
        logger.info(f"Headers: {self.headers}, Has idx: {self.has_idx_column}")

    async def _estimate_bytes_per_row(self) -> int:
        """행당 평균 바이트 수를 추정합니다"""
        # 파일의 처음 100KB를 샘플링하여 평균 계산
        sample_size = min(100 * 1024, self.file_size)
        response = self.minio_client.client.get_object(
            self.bucket_name,
            self.object_name,
            length=sample_size
        )
        sample_data = response.read()

        # 줄 수 계산 (첫 줄은 헤더이므로 제외)
        lines = sample_data.count(b'\n') - 1
        if lines > 0:
            # 헤더 크기 제외
            header_end = sample_data.find(b'\n')
            content_size = sample_size - header_end - 1
            return content_size // lines
        return 100  # 기본값

    async def _find_line_boundary(self, start_byte: int, direction: str = 'forward') -> int:
        """바이트 위치에서 줄바꿈 경계를 찾습니다"""
        search_size = 1024  # 1KB 범위에서 검색

        if direction == 'forward':
            # 지정된 위치 이후 첫 번째 줄바꿈 찾기
            response = self.minio_client.client.get_object(
                self.bucket_name,
                self.object_name,
                offset=start_byte,
                length=search_size
            )
            data = response.read()

            newline_pos = data.find(b'\n')
            return start_byte + newline_pos if newline_pos != -1 else start_byte
        else:
            # 지정된 위치 이전 마지막 줄바꿈 찾기
            search_start = max(0, start_byte - search_size)
            response = self.minio_client.client.get_object(
                self.bucket_name,
                self.object_name,
                offset=search_start,
                length=start_byte - search_start
            )
            data = response.read()

            newline_pos = data.rfind(b'\n')
            return search_start + newline_pos if newline_pos != -1 else start_byte

    async def _get_header_size(self) -> int:
        """헤더 라인의 크기를 반환합니다"""
        response = self.minio_client.client.get_object(
            self.bucket_name,
            self.object_name,
            length=1024
        )
        data = response.read()
        header_end = data.find(b'\n')
        return header_end + 1 if header_end != -1 else 0

    async def _find_byte_position_for_idx(self, target_idx: int) -> int:
        """특정 idx 값의 대략적인 바이트 위치를 찾습니다 (바이너리 서치)"""
        if not self.has_idx_column:
            return 0

        header_size = await self._get_header_size()
        
        # 작은 idx 값들은 헤더 근처에서 찾기
        if target_idx <= 10:  # 처음 몇 개 행은 특별 처리
            return header_size

        # 파일의 시작과 끝 위치 설정
        left = header_size
        right = self.file_size

        # 바이너리 서치
        while right - left > self.chunk_size:
            mid = (left + right) // 2
            mid = await self._find_line_boundary(mid, 'forward')

            # 중간 지점의 idx 값 확인
            mid_idx = await self._get_idx_at_position(mid)

            if mid_idx is None:
                break

            if mid_idx < target_idx:
                left = mid
            else:
                right = mid

        # 안전하게 왼쪽 위치 반환
        return left

    async def _get_idx_at_position(self, byte_pos: int) -> Optional[int]:
        """특정 바이트 위치의 idx 값을 가져옵니다"""
        if not self.has_idx_column:
            return None

        response = self.minio_client.client.get_object(
            self.bucket_name,
            self.object_name,
            offset=byte_pos,
            length=1024
        )
        data = response.read()
        try:
            # 첫 번째 완전한 줄 찾기
            lines = data.split(b'\n')
            if not lines:
                return None

            # 헤더 바로 다음 위치인지 확인
            header_size = await self._get_header_size()
            
            if byte_pos == header_size:
                # 헤더 바로 다음 위치면 첫 번째 줄이 첫 번째 데이터 행
                first_line = lines[0]
            else:
                # 그렇지 않으면 첫 줄이 불완전할 수 있으므로 두 번째 줄 사용
                first_line = lines[1] if len(lines) > 1 else lines[0]

            if not first_line:
                return None

            # idx 값 추출
            idx_pos = self.headers.index('idx')
            fields = first_line.decode(self.encoding).split(',')
            return int(fields[idx_pos])
        except Exception as e:
            logger.error(f"Error getting idx at position {byte_pos}: {e}")
            return None

    async def _read_chunk(self, start_byte: int, end_byte: int) -> Optional[pd.DataFrame]:
        """지정된 바이트 범위의 청크를 읽습니다"""
        try:
            header_size = await self._get_header_size()
            
            # 헤더 바로 다음 위치가 아닌 경우에만 줄 경계 조정
            if start_byte > 0 and start_byte != header_size:
                start_byte = await self._find_line_boundary(start_byte, 'forward')
            if end_byte < self.file_size:
                end_byte = await self._find_line_boundary(end_byte, 'backward')

            if start_byte >= end_byte:
                return pd.DataFrame()

            response = self.minio_client.client.get_object(
                self.bucket_name,
                self.object_name,
                offset=start_byte,
                length=end_byte - start_byte
            )
            chunk_data = response.read()

            # DataFrame으로 변환
            if start_byte == 0:
                # 헤더 포함
                df = pd.read_csv(
                    io.BytesIO(chunk_data),
                    encoding=self.encoding
                )
            else:
                # 헤더 없음
                df = pd.read_csv(
                    io.BytesIO(chunk_data),
                    encoding=self.encoding,
                    header=None,
                    names=self.headers
                )

            return df

        except Exception as e:
            logger.error(f"청크 읽기 중 오류 ({start_byte}-{end_byte}): {e}")
            return None

    def _apply_filter(self, df: pd.DataFrame, filter_condition: str) -> pd.DataFrame:
        """데이터프레임에 필터 조건을 적용합니다"""
        try:
            return df.query(filter_condition)
        except Exception as e:
            logger.warning(f"필터 조건 적용 실패 ({filter_condition}): {e}")
            return df

    async def _estimate_total_records(self, filter_condition: str = None) -> int:
        """전체 레코드 수를 추정합니다 (샘플링 기반)"""
        # 파일의 10% 샘플링
        sample_size = min(self.file_size // 10, 10 * 1024 * 1024)  # 최대 10MB

        # 여러 위치에서 샘플링
        sample_points = 5
        total_sampled_rows = 0
        total_filtered_rows = 0

        for i in range(sample_points):
            start_byte = (self.file_size // sample_points) * i
            if i == 0:
                start_byte = await self._get_header_size()

            end_byte = min(start_byte + sample_size, self.file_size)

            sample_df = await self._read_chunk(start_byte, end_byte)
            if sample_df is not None and not sample_df.empty:
                total_sampled_rows += len(sample_df)

                if filter_condition:
                    filtered_df = self._apply_filter(sample_df, filter_condition)
                    total_filtered_rows += len(filtered_df)
                else:
                    total_filtered_rows += len(sample_df)

        if total_sampled_rows == 0:
            return 0

        # 비율 계산
        filter_ratio = total_filtered_rows / total_sampled_rows

        # 전체 파일의 행 수 추정
        bytes_per_row = await self._estimate_bytes_per_row()
        content_size = self.file_size - await self._get_header_size()
        estimated_total_rows = content_size // bytes_per_row

        return int(estimated_total_rows * filter_ratio)

    async def query_csv_with_paging(
            self,
            page: int = 1,
            page_size: int = 10,
            last_idx: int = None,
            filter_condition: str = None,
    ) -> Dict[str, Any]:
        """
        청크 기반 페이징 쿼리 실행 (캐시 없음)
        """
        try:
            await self._initialize_if_needed()

            if self.has_idx_column:
                return await self._query_with_idx_pagination(
                    page, page_size, last_idx, filter_condition
                )
            else:
                return await self._query_without_idx_pagination(
                    page, page_size, filter_condition
                )

        except Exception as e:
            logger.error(f"CSV 페이징 쿼리 중 오류: {e}")
            raise

    async def _query_with_idx_pagination(
            self,
            page: int,
            page_size: int,
            last_idx: int,
            filter_condition: str
    ) -> Dict[str, Any]:
        """idx 컬럼이 있는 경우의 페이징 처리"""

        # 시작 idx 계산
        if last_idx is not None:
            start_idx = last_idx
        else:
            start_idx = (page - 1) * page_size + 1

        end_idx = start_idx + page_size - 1

        # 바이너리 서치를 통해 시작 위치 찾기
        start_byte = await self._find_byte_position_for_idx(start_idx)

        # 충분한 데이터를 읽기 위한 청크 크기 계산
        bytes_per_row = await self._estimate_bytes_per_row()
        # 여유분을 두고 더 많이 읽음 (필터링 고려)
        estimated_bytes = bytes_per_row * page_size * 3

        end_byte = min(start_byte + estimated_bytes, self.file_size)

        # 데이터 읽기 및 처리
        result_data = []
        current_byte = start_byte

        while len(result_data) < page_size and current_byte < self.file_size:
            # 청크 읽기
            chunk_end = min(current_byte + self.chunk_size, self.file_size)
            chunk_end = await self._find_line_boundary(chunk_end, 'backward')

            chunk_data = await self._read_chunk(current_byte, chunk_end)
            if chunk_data is None or chunk_data.empty:
                break

            # 필터 적용
            if filter_condition:
                chunk_data = self._apply_filter(chunk_data, filter_condition)

            # idx 범위 필터링
            chunk_data = chunk_data[
                (chunk_data['idx'] >= start_idx) &
                (chunk_data['idx'] <= end_idx)
                ]

            # 결과에 추가
            remaining_needed = page_size - len(result_data)
            result_data.append(chunk_data.head(remaining_needed))

            current_byte = chunk_end + 1

        # 결과 합치기
        if result_data:
            final_df = pd.concat(result_data, ignore_index=True)
            final_df = final_df.sort_values('idx').head(page_size)
        else:
            final_df = pd.DataFrame()

        # 전체 레코드 수 계산 (샘플링 기반 추정)
        total_records = await self._estimate_total_records(filter_condition)
        total_pages = (total_records + page_size - 1) // page_size

        return {
            "data": final_df.to_dict('records') if not final_df.empty else [],
            "total": total_records,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_idx_column": True,
            "last_idx": final_df['idx'].max() if not final_df.empty else last_idx
        }

    async def _query_without_idx_pagination(
            self,
            page: int,
            page_size: int,
            filter_condition: str
    ) -> Dict[str, Any]:
        """idx 컬럼이 없는 경우의 페이징 처리"""

        skip_rows = (page - 1) * page_size
        collected_rows = 0
        result_data = []

        # 헤더 이후부터 시작
        current_byte = await self._get_header_size()

        while collected_rows < page_size and current_byte < self.file_size:
            # 청크 읽기
            chunk_end = min(current_byte + self.chunk_size, self.file_size)
            chunk_end = await self._find_line_boundary(chunk_end, 'backward')

            chunk_data = await self._read_chunk(current_byte, chunk_end)
            if chunk_data is None or chunk_data.empty:
                break

            # 필터 적용
            if filter_condition:
                filtered_data = self._apply_filter(chunk_data, filter_condition)
            else:
                filtered_data = chunk_data

            # 스킵할 행 처리
            if skip_rows > 0:
                if len(filtered_data) <= skip_rows:
                    skip_rows -= len(filtered_data)
                    current_byte = chunk_end + 1
                    continue
                else:
                    filtered_data = filtered_data.iloc[skip_rows:]
                    skip_rows = 0

            # 필요한 만큼만 가져오기
            remaining_needed = page_size - collected_rows
            if len(filtered_data) > remaining_needed:
                filtered_data = filtered_data.head(remaining_needed)

            result_data.append(filtered_data)
            collected_rows += len(filtered_data)
            current_byte = chunk_end + 1

        # 결과 합치기
        if result_data:
            final_df = pd.concat(result_data, ignore_index=True)
        else:
            final_df = pd.DataFrame()

        # 전체 레코드 수 추정
        total_records = await self._estimate_total_records(filter_condition)
        total_pages = (total_records + page_size - 1) // page_size

        return {
            "data": final_df.to_dict('records') if not final_df.empty else [],
            "total": total_records,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_idx_column": False,
            "last_idx": None
        }