import pandas as pd
import numpy as np
from datetime import datetime
from core.exception import CustomAPIException
import io

class MissingValueHandler:
    def __init__(self, data_path=None, df=None):
        """
        결측치 처리 클래스 초기화

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
                self.df = pd.read_csv(data_path)
            else:
                self.df = pd.read_csv(data_path)
        else:
            raise CustomAPIException(
                status_code=400,
                error_code="MISSING_VALUE_001",
                message="데이터 파일 경로 또는 데이터프레임을 제공해야 합니다."
            )
        # 원본 데이터 백업
        self.original_df = self.df.copy()

    def get_missing_info(self):
        """결측치 정보 조회"""
        missing_values = self.df.isnull().sum()
        missing_ratio = (missing_values / len(self.df)) * 100
        missing_data = pd.concat([missing_values, missing_ratio], axis=1)
        missing_data.columns = ['결측치 수', '결측치 비율(%)']

        # 결측치가 있는 컬럼만 필터링
        missing_data = missing_data[missing_data['결측치 수'] > 0]

        # 각 컬럼별 결측치 정보를 담은 딕셔너리 생성
        result = {}
        for idx, row in missing_data.iterrows():
            result[idx] = {
                '결측치 수': int(row['결측치 수']),
                '결측치 비율(%)': float(row['결측치 비율(%)'])
            }

        return result

    def handle_missing_values_imputation(self, column, method='MEAN'):
        """
        선택한 컬럼의 결측치 처리

        Parameters:
        -----------
        column : str
            처리할 컬럼 이름
        method : str, default='MEAN'
            대체 방법 ('MEAN', 'MEDIAN', 'MODE')

        Returns:
        --------
        dict
            처리 결과 정보
        """
        if column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="MISSING_VALUE_002",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )

        # 결측치가 있는 행 인덱스 저장
        missing_indices = self.df[self.df[column].isnull()].index.tolist()

        if not missing_indices:
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_003",
                message=f"컬럼 '{column}'에 결측치가 없습니다."
            )

        # 원래 데이터의 복사본 저장
        original_rows = self.df.loc[missing_indices].copy()
        missing_count = len(missing_indices)

        # 데이터 타입 확인
        is_numeric = pd.api.types.is_numeric_dtype(self.df[column])

        # 결측치 대체 방법에 따라 처리
        if method == 'MEAN':
            if not is_numeric:
                raise CustomAPIException(
                    status_code=400,
                    error_code="MVH_004",
                    message=f"'{column}' 컬럼은 숫자형이 아니므로 평균값 대체가 불가능합니다."
                )
            fill_value = self.df[column].mean()
        elif method == 'MEDIAN':
            if not is_numeric:
                raise CustomAPIException(
                    status_code=400,
                    error_code="MVH_005",
                    message=f"'{column}' 컬럼은 숫자형이 아니므로 중앙값 대체가 불가능합니다."
                )
            fill_value = self.df[column].median()
        elif method == 'MODE':
            fill_value = self.df[column].mode()[0]
        else:
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_006",
                message=f"지원하지 않는 대체 방법입니다: {method}. 'MEAN', 'MEDIAN', 'MODE' 중 하나를 사용하세요."
            )

        # 결측치 대체
        self.df[column].fillna(fill_value, inplace=True)

        # 변경된 행
        imputed_rows = self.df.loc[missing_indices].copy()

        # API 응답 형식에 맞게 결과 구성
        result = {
            "column": column,
            "method": method,
            "missingCount": missing_count,
            "imputedCount": missing_count,
            "fillValue": float(fill_value) if isinstance(fill_value, (int, float)) else str(fill_value),
            "missingIndices": missing_indices,
            "originalRows": original_rows.to_dict('records'),
            "imputedRows": imputed_rows.to_dict('records'),
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        }

        return result

    def handle_missing_values_remove(self, column=None, method='ROW_REMOVE'):
        """
        결측치가 포함된 행 또는 열 제거

        Parameters:
        -----------
        column : str, optional
            처리할 컬럼 이름. None인 경우 전체 데이터에 적용
        method : str, default='ROW_REMOVE'
            제거 방법 ('ROW_REMOVE': 행 제거, 'COL_REMOVE': 열 제거)

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 특정 컬럼이 지정된 경우 해당 컬럼 존재 여부 확인
        if column is not None and column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_002",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )
        
        # 결측치 개수 확인
        if column is None:
            # 전체 데이터의 결측치 개수
            original_missing_count = self.df.isnull().sum().sum()
        else:
            # 특정 컬럼의 결측치 개수
            original_missing_count = self.df[column].isnull().sum()

        if original_missing_count == 0:
            if column is None:
                message = "데이터에 결측치가 없습니다."
            else:
                message = f"컬럼 '{column}'에 결측치가 없습니다."
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_007",
                message=message
            )

        # 결측치가 있는 행 또는 열 찾기
        missing_indices = []
        removed_rows = []
        removed_columns = []

        if method == 'ROW_REMOVE':
            if column is None:
                # 전체 데이터에서 결측치가 있는 행 인덱스
                missing_indices = self.df[self.df.isnull().any(axis=1)].index.tolist()
            else:
                # 특정 컬럼에서 결측치가 있는 행 인덱스
                missing_indices = self.df[self.df[column].isnull()].index.tolist()

            # 제거 전 원본 행 저장
            removed_rows = self.df.loc[missing_indices].copy().to_dict('records')

            # 행 제거
            self.df = self.df.drop(missing_indices)

        elif method == 'COL_REMOVE':
            if column is None:
                # 결측치가 있는 모든 열 이름
                removed_columns = [col for col in self.df.columns if self.df[col].isnull().any()]
            else:
                # 특정 컬럼에 결측치가 있는 경우만 제거
                if self.df[column].isnull().any():
                    removed_columns = [column]
                else:
                    removed_columns = []

            # 열 제거
            if removed_columns:
                self.df = self.df.drop(columns=removed_columns)

        else:
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_008",
                message=f"지원하지 않는 제거 방법입니다: {method}. 'ROW_REMOVE' 또는 'COL_REMOVE'를 사용하세요."
            )

        # API 응답 형식에 맞게 결과 구성
        result = {
            "column": column,  # 처리된 컬럼 (None이면 전체)
            "method": method,
            "missingCount": int(original_missing_count),
            "removedCount": len(missing_indices) if method == 'ROW_REMOVE' else len(removed_columns),
            "missingIndices": missing_indices,
            "removedRows": removed_rows,
            "removedColumns": removed_columns,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        }

        return result