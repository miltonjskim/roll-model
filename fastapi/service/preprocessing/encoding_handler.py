import pandas as pd
import numpy as np
import io
from datetime import datetime
from core.exception import CustomAPIException


class EncodingHandler:
    def __init__(self, data_path=None, df=None, encoding="utf-8"):
        """
        데이터 인코딩 처리 클래스 초기화

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
                error_code="ENCODING_001",
                message="데이터 파일 경로 또는 데이터프레임을 제공해야 합니다."
            )
        # 원본 데이터 백업
        self.original_df = self.df.copy()

    def encode_onehot(self, column):
        """
        원-핫 인코딩 적용

        Parameters:
        -----------
        column : str
            인코딩할 컬럼 이름

        Returns:
        --------
        dict
            처리 결과 정보
        """
        if column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_002",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )

        # 결측치 확인
        if self.df[column].isnull().any():
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_003",
                message=f"컬럼 '{column}'에 결측치가 있어 원-핫 인코딩이 불가능합니다. 먼저 결측치를 처리해주세요."
            )

        # 범주 추출
        categories = sorted(self.df[column].unique().tolist())

        # 원-핫 인코딩 적용
        df_encoded = pd.get_dummies(self.df, columns=[column], prefix=column)
        self.df = df_encoded

        # 새로 생성된 컬럼 이름들
        new_columns = [col for col in df_encoded.columns if col.startswith(f"{column}_")]

        # 영향받은 행 수 (전체 행이 영향받음)
        affected_rows = len(self.df)

        # 결과 구성
        return {
            "encodingType": "ONE_HOT",
            "column": column,
            "categories": categories,
            "newColumns": new_columns,
            "affectedRows": affected_rows,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        }

    def encode_label(self, column):
        """
        레이블 인코딩 적용

        Parameters:
        -----------
        column : str
            인코딩할 컬럼 이름

        Returns:
        --------
        dict
            처리 결과 정보
        """
        if column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_002",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )

        # 결측치 확인
        if self.df[column].isnull().any():
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_003",
                message=f"컬럼 '{column}'에 결측치가 있어 레이블 인코딩이 불가능합니다. 먼저 결측치를 처리해주세요."
            )

        # 범주 추출 및 정렬
        categories = sorted(self.df[column].unique().tolist())

        # 레이블 매핑 생성
        label_mapping = {cat: idx for idx, cat in enumerate(categories)}

        # 레이블 인코딩 적용
        self.df[column] = self.df[column].map(label_mapping)

        # 영향받은 행 수
        affected_rows = len(self.df)

        # 결과 구성
        return {
            "encodingType": "LABEL",
            "column": column,
            "mapping": label_mapping,
            "affectedRows": affected_rows,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        }

    def encode_target(self, column, target_column):
        """
        타겟 인코딩 적용

        Parameters:
        -----------
        column : str
            인코딩할 컬럼 이름
        target_column : str
            타겟 컬럼 이름

        Returns:
        --------
        dict
            처리 결과 정보
        """
        if column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_002",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )

        if target_column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_002",
                message=f"타겟 컬럼 '{target_column}'이 데이터에 존재하지 않습니다."
            )

        # 타겟 컬럼이 이진값인지 확인 (0/1 또는 True/False)
        unique_targets = self.df[target_column].unique()
        is_binary = len(unique_targets) == 2 and set(unique_targets).issubset({0, 1, True, False})

        if not is_binary:
            # 연속형 타겟의 경우 평균값 사용
            if not pd.api.types.is_numeric_dtype(self.df[target_column]):
                raise CustomAPIException(
                    status_code=400,
                    error_code="ENCODING_004",
                    message=f"타겟 컬럼 '{target_column}'이 이진값이 아니고 숫자형도 아닙니다."
                )

        # 결측치 확인
        if self.df[column].isnull().any():
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_003",
                message=f"컬럼 '{column}'에 결측치가 있어 타겟 인코딩이 불가능합니다."
            )

        if self.df[target_column].isnull().any():
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_003",
                message=f"타겟 컬럼 '{target_column}'에 결측치가 있어 타겟 인코딩이 불가능합니다."
            )

        # 타겟 인코딩 계산
        target_encoding = self.df.groupby(column)[target_column].mean().to_dict()

        # 타겟 인코딩 적용
        self.df[column] = self.df[column].map(target_encoding)

        # 영향받은 행 수
        affected_rows = len(self.df)

        # 결과 구성
        return {
            "encodingType": "TARGET",
            "column": column,
            "targetColumn": target_column,
            "mapping": {k: float(v) for k, v in target_encoding.items()},
            "affectedRows": affected_rows,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        }