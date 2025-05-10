from datetime import datetime
from core.exception import CustomAPIException
import pandas as pd
import io

class ClassBalancingHandler:
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