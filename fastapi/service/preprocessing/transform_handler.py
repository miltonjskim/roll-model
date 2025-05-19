import pandas as pd
import numpy as np
import io
from datetime import datetime
from core.exception import CustomAPIException


class TransformationHandler:
    def __init__(self, data_path=None, df=None, encoding="utf-8"):
        """
        데이터 변환 처리 클래스 초기화

        Parameters:
        -----------
        data_path : str or BytesIO, optional
            데이터 파일 경로 또는 BytesIO 객체
        df : pandas.DataFrame, optional
            직접 데이터프레임 전달 시 사용
        """
        if df is not None:
            self.df = df.copy()
        elif data_path is not None:
            if isinstance(data_path, io.BytesIO):
                self.df = pd.read_csv(data_path, encoding=encoding)
            else:
                self.df = pd.read_csv(data_path, encoding=encoding)
        else:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_001",
                message="데이터 파일 경로 또는 데이터프레임을 제공해야 합니다."
            )
        # 원본 데이터 백업
        self.original_df = self.df.copy()

    def _get_numeric_columns(self):
        """숫자형 컬럼 목록 반환"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_002",
                message="숫자형 컬럼이 없습니다."
            )
        return numeric_cols

    def _check_column_exists(self, column):
        """컬럼 존재 여부 확인"""
        if column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_003",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )

    def _check_numeric_column(self, column, transform_type):
        """숫자형 컬럼인지 확인"""
        if not pd.api.types.is_numeric_dtype(self.df[column]):
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_004",
                message=f"컬럼 '{column}'은 숫자형이 아니므로 {transform_type}이 불가능합니다."
            )

    def _check_missing_values(self, column, transform_type):
        """결측치 확인"""
        if self.df[column].isnull().any():
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_005",
                message=f"컬럼 '{column}'에 결측치가 있어 {transform_type}이 불가능합니다. 먼저 결측치를 처리해주세요."
            )

    def scale_zscore(self, column=None):
        """
        Z-Score 표준화 적용

        Parameters:
        -----------
        column : str, optional
            표준화할 컬럼 이름. None인 경우 모든 숫자형 컬럼에 적용

        Returns:
        --------
        dict
            처리 결과 정보
        """
        results = []

        if column is None:
            # 모든 숫자형 컬럼에 적용
            numeric_columns = self._get_numeric_columns()

            for col in numeric_columns:
                try:
                    result = self._apply_zscore_to_column(col)
                    results.append(result)
                except CustomAPIException:
                    # 특정 컬럼 처리 실패 시 다음 컬럼으로 진행
                    continue

            if not results:
                raise CustomAPIException(
                    status_code=400,
                    error_code="TRANSFORM_010",
                    message="모든 숫자형 컬럼에 대해 Z-Score 표준화를 적용할 수 없습니다."
                )

            # 전체 결과를 하나로 합치기
            return {
                "transformType": "ZSCORE",
                "column": "all_numeric",
                "statistics": {
                    "columns_processed": [r["column"] for r in results],
                    "details": results
                },
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0 
            }
        else:
            # 특정 컬럼에만 적용
            self._check_column_exists(column)
            return self._apply_zscore_to_column(column)

    def _apply_zscore_to_column(self, column):
        """단일 컬럼에 Z-score 표준화 적용"""
        # 숫자형 확인
        self._check_numeric_column(column, "Z-Score 표준화")

        # 결측치 확인
        self._check_missing_values(column, "표준화")

        # 표준화 전 통계량 저장
        mean_val = self.df[column].mean()
        std_val = self.df[column].std()

        # 표준 편차가 0인 경우 처리
        if std_val == 0:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_006",
                message=f"컬럼 '{column}'의 표준편차가 0이어서 표준화가 불가능합니다."
            )

        # 표준화 적용
        self.df[column] = (self.df[column] - mean_val) / std_val

        # 결과 구성
        return {
            "transformType": "ZSCORE",
            "column": column,
            "statistics": {
                "mean": float(mean_val),
                "std": float(std_val)
            },
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "startPoint": 0
        }

    def scale_minmax(self, column=None, min_value=0, max_value=1):
        """
        Min-Max 스케일링 적용

        Parameters:
        -----------
        column : str, optional
            스케일링할 컬럼 이름. None인 경우 모든 숫자형 컬럼에 적용
        min_value : float, default=0
            최소값
        max_value : float, default=1
            최대값

        Returns:
        --------
        dict
            처리 결과 정보
        """
        results = []

        if column is None:
            # 모든 숫자형 컬럼에 적용
            numeric_columns = self._get_numeric_columns()

            for col in numeric_columns:
                try:
                    result = self._apply_minmax_to_column(col, min_value, max_value)
                    results.append(result)
                except CustomAPIException:
                    # 특정 컬럼 처리 실패 시 다음 컬럼으로 진행
                    continue

            if not results:
                raise CustomAPIException(
                    status_code=400,
                    error_code="TRANSFORM_010",
                    message="모든 숫자형 컬럼에 대해 Min-Max 스케일링을 적용할 수 없습니다."
                )

            # 전체 결과를 하나로 합치기
            return {
                "transformType": "MINMAX",
                "column": "all_numeric",
                "originalRange": {
                    "columns_processed": [r["column"] for r in results],
                    "details": results
                },
                "newRange": {
                    "min": min_value,
                    "max": max_value
                },
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
            }
        else:
            # 특정 컬럼에만 적용
            self._check_column_exists(column)
            return self._apply_minmax_to_column(column, min_value, max_value)

    def _apply_minmax_to_column(self, column, min_value=0, max_value=1):
        """단일 컬럼에 Min-Max 스케일링 적용"""
        # 숫자형 확인
        self._check_numeric_column(column, "Min-Max 스케일링")

        # 결측치 확인
        self._check_missing_values(column, "스케일링")

        # 기존 범위 저장
        original_min = self.df[column].min()
        original_max = self.df[column].max()

        # 최소값과 최대값이 같은 경우 처리
        if original_min == original_max:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_007",
                message=f"컬럼 '{column}'의 모든 값이 동일하여 스케일링이 불가능합니다."
            )

        # Min-Max 스케일링 적용
        self.df[column] = (self.df[column] - original_min) / (original_max - original_min) * (
                    max_value - min_value) + min_value

        # 결과 구성
        return {
            "transformType": "MINMAX",
            "column": column,
            "originalRange": {
                "min": float(original_min),
                "max": float(original_max)
            },
            "newRange": {
                "min": min_value,
                "max": max_value
            },
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "startPoint": 0
        }

    def transform_log(self, column=None, offset=1.0):
        """
        로그 변환 적용

        Parameters:
        -----------
        column : str, optional
            변환할 컬럼 이름. None인 경우 모든 숫자형 컬럼에 적용
        offset : float, default=1.0
            오프셋 값 (음수나 0을 피하기 위해 추가)

        Returns:
        --------
        dict
            처리 결과 정보
        """
        results = []

        if column is None:
            # 모든 숫자형 컬럼에 적용
            numeric_columns = self._get_numeric_columns()

            for col in numeric_columns:
                try:
                    result = self._apply_log_to_column(col, offset)
                    results.append(result)
                except CustomAPIException:
                    # 특정 컬럼 처리 실패 시 다음 컬럼으로 진행
                    continue

            if not results:
                raise CustomAPIException(
                    status_code=400,
                    error_code="TRANSFORM_010",
                    message="모든 숫자형 컬럼에 대해 로그 변환을 적용할 수 없습니다."
                )

            # 전체 결과를 하나로 합치기
            return {
                "transformType": "LOG",
                "column": "all_numeric",
                "offset": float(offset),
                "transformedDetails": {
                    "columns_processed": [r["column"] for r in results],
                    "details": results
                },
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0
            }
        else:
            # 특정 컬럼에만 적용
            self._check_column_exists(column)
            return self._apply_log_to_column(column, offset)

    def _apply_log_to_column(self, column, offset=1.0):
        """단일 컬럼에 로그 변환 적용"""
        # 숫자형 확인
        self._check_numeric_column(column, "로그 변환")

        # 결측치 확인
        self._check_missing_values(column, "로그 변환")

        # 음수 값 확인
        negative_count = (self.df[column] < 0).sum()

        # offset 적용 후에도 음수나 0이 되는 값 확인
        min_value_with_offset = (self.df[column] + offset).min()
        if min_value_with_offset <= 0:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_008",
                message=f"오프셋({offset})을 적용한 후에도 음수나 0이 존재합니다. 더 큰 오프셋을 사용하세요."
            )

        # 변환될 인덱스 (모든 행)
        transformed_indices = self.df.index.tolist()

        # 로그 변환 적용
        self.df[column] = np.log(self.df[column] + offset)

        # 결과 구성
        return {
            "transformType": "LOG",
            "column": column,
            "offset": float(offset),
            "transformedIndices": transformed_indices,
            "negativeValues": int(negative_count),
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "startPoint": 0
        }

    def transform_sqrt(self, column=None):
        """
        제곱근 변환 적용

        Parameters:
        -----------
        column : str, optional
            변환할 컬럼 이름. None인 경우 모든 숫자형 컬럼에 적용

        Returns:
        --------
        dict
            처리 결과 정보
        """
        results = []

        if column is None:
            # 모든 숫자형 컬럼에 적용
            numeric_columns = self._get_numeric_columns()

            for col in numeric_columns:
                try:
                    result = self._apply_sqrt_to_column(col)
                    results.append(result)
                except CustomAPIException:
                    # 특정 컬럼 처리 실패 시 다음 컬럼으로 진행
                    continue

            if not results:
                raise CustomAPIException(
                    status_code=400,
                    error_code="TRANSFORM_010",
                    message="모든 숫자형 컬럼에 대해 제곱근 변환을 적용할 수 없습니다."
                )

            # 전체 결과를 하나로 합치기
            return {
                "transformType": "SQRT",
                "column": "all_numeric",
                "transformedDetails": {
                    "columns_processed": [r["column"] for r in results],
                    "details": results
                },
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0
            }
        else:
            # 특정 컬럼에만 적용
            self._check_column_exists(column)
            return self._apply_sqrt_to_column(column)

    def _apply_sqrt_to_column(self, column):
        """단일 컬럼에 제곱근 변환 적용"""
        # 숫자형 확인
        self._check_numeric_column(column, "제곱근 변환")

        # 결측치 확인
        self._check_missing_values(column, "제곱근 변환")

        # 음수 값 확인
        negative_count = (self.df[column] < 0).sum()

        if negative_count > 0:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_009",
                message=f"컬럼 '{column}'에 음수 값이 {negative_count}개 있어 제곱근 변환이 불가능합니다."
            )

        # 변환될 인덱스 (모든 행)
        transformed_indices = self.df.index.tolist()

        # 제곱근 변환 적용
        self.df[column] = np.sqrt(self.df[column])

        # 결과 구성
        return {
            "transformType": "SQRT",
            "column": column,
            "transformedIndices": transformed_indices,
            "negativeValues": 0,  # 음수가 없어야 변환이 가능하므로 항상 0
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "startPoint": 0
        }