import io
import pandas as pd
from datetime import datetime

from core.exception import CustomAPIException

class ColumnHandler:
    def __init__(self, data_path=None, df=None, encoding="utf-8"):
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
                error_code="COLUMN_001",
                message="데이터 파일 경로 또는 데이터프레임을 제공해야 합니다."
            )
        # 원본 데이터 백업
        self.original_df = self.df.copy()

    def _check_columns_exist(self, columns):
        """
        컬럼 존재 여부 확인
        
        Parameters:
        -----------
        columns : list or str
            확인할 컬럼 이름 또는 컬럼 목록
            
        Raises:
        -------
        CustomAPIException
            컬럼이 존재하지 않는 경우
        """
        if isinstance(columns, str):
            columns = [columns]
            
        missing_columns = [col for col in columns if col not in self.df.columns]
        if missing_columns:
            raise CustomAPIException(
                status_code=400,
                error_code="COLUMN_002",
                message=f"다음 컬럼이 데이터에 존재하지 않습니다: {', '.join(missing_columns)}"
            )

    def remove_columns(self, columns=None):
        """
        선택한 컬럼 제거
        
        Parameters:
        -----------
        columns : list or str, optional
            제거할 컬럼 이름 또는 컬럼 목록. None인 경우 제거 작업 없음.
            
        Returns:
        --------
        dict
            처리 결과 정보
        """
        if columns is None:
            return {
                "removed_columns": [],
                "remaining_columns": self.df.columns.tolist(),
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0
            }
            
        # 문자열인 경우 리스트로 변환
        if isinstance(columns, str):
            columns = [columns]
            
        # 컬럼 존재 여부 확인
        self._check_columns_exist(columns)
        
        # 컬럼 제거
        self.df = self.df.drop(columns=columns)
        
        # 결과 구성
        return {
            "removed_columns": columns,
            "remaining_columns": self.df.columns.tolist(),
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "startPoint": 0
        }
        
    def keep_columns(self, columns=None):
        """
        선택한 컬럼만 유지하고 나머지 제거
        
        Parameters:
        -----------
        columns : list or str, optional
            유지할 컬럼 이름 또는 컬럼 목록. None인 경우 모든 컬럼 유지.
            
        Returns:
        --------
        dict
            처리 결과 정보
        """
        if columns is None:
            return {
                "kept_columns": self.df.columns.tolist(),
                "removed_columns": [],
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0
            }
            
        # 문자열인 경우 리스트로 변환
        if isinstance(columns, str):
            columns = [columns]
            
        # 컬럼 존재 여부 확인
        self._check_columns_exist(columns)
        
        # 원본 컬럼 목록 저장
        original_columns = self.df.columns.tolist()
        
        # 제거할 컬럼 계산
        columns_to_remove = [col for col in original_columns if col not in columns]
        
        # 선택한 컬럼만 유지
        self.df = self.df[columns]
        
        # 결과 구성
        return {
            "kept_columns": columns,
            "removed_columns": columns_to_remove,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "startPoint": 0
        }