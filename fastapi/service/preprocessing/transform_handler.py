from datetime import datetime
from core.exception import CustomAPIException
import pandas as pd
import io

class TransformationHandler:
    def __init__(self, data_path=None, df=None):
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
                self.df = pd.read_csv(data_path)
            else:
                self.df = pd.read_csv(data_path)
        else:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_001",
                message=f"데이터 파일 경로 또는 데이터프레임을 제공해야 합니다."
            )
        # 원본 데이터 백업
        self.original_df = self.df.copy()

    def scale_zscore(self, column):
        """
        Z-Score 표준화 적용

        Parameters:
        -----------
        column : str
            표준화할 컬럼 이름

        Returns:
        --------
        dict
            처리 결과 정보
        """
        if column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_002",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )

        # 숫자형 확인
        if not pd.api.types.is_numeric_dtype(self.df[column]):
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_003",
                message=f"컬럼 '{column}'은 숫자형이 아니므로 Z-Score 표준화가 불가능합니다."
            )

        # 결측치 확인
        if self.df[column].isnull().any():
            raise CustomAPIException(
                status_code=400,
                error_code="TRANSFORM_004",
                message=f"컬럼 '{column}'에 결측치가 있어 표준화가 불가능합니다. 먼저 결측치를 처리해주세요."
            )

        # 표준화 전 통계량 저장
        mean_val = self.df[column].mean()
        std_val = self.df[column].std()

        # 표준화 적용
        self.df[column] = (self.df[column] - mean_val) / std_val

        # 변환된 행 인덱스
        transformed_indices = self.df.index.tolist()

        # 결과 구성
        result = {
            "result": {
                "transformType": "Z_SCORE",
                "column": column,
                "statistics": {
                    "mean": float(mean_val),
                    "std": float(std_val)
                },
                "transformedIndices": transformed_indices,
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
            }
        }

        return result

    def scale_minmax(self, column, min_value=0, max_value=1, custom_range=False):
        """
        Min-Max 스케일링 적용

        Parameters:
        -----------
        column : str
            스케일링할 컬럼 이름
        min_value : float, default=0
            최소값
        max_value : float, default=1
            최대값
        custom_range : bool, default=False
            사용자 정의 범위 사용 여부

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 유효성 검사 및 스케일링 로직 구현
        # ...

        return result

    def transform_log(self, column, offset=1.0):
        """
        로그 변환 적용

        Parameters:
        -----------
        column : str
            변환할 컬럼 이름
        offset : float, default=1.0
            오프셋 값

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 유효성 검사 및 로그 변환 로직 구현
        # ...

        return result

    def transform_sqrt(self, column):
        """
        제곱근 변환 적용

        Parameters:
        -----------
        column : str
            변환할 컬럼 이름

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 유효성 검사 및 제곱근 변환 로직 구현
        # ...

        return result