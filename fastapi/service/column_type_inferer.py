import pandas as pd
import numpy as np
import re
from typing import List, Dict, Any
from utils.execution_time_checker import execution_time
from utils.column_name_cleaner import clean_column_name

class ColumnTypeInferrer:
    """최적화된 컬럼 타입 추론기"""
    
    def __init__(self, sample_size: int = 1000):
        self.sample_size = sample_size
        self.boolean_values = {True, False, "True", "False", "true", "false", 1, 0, "1", "0"}
        self.datetime_patterns = [
            r'^\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'^\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
            r'^\d{4}/\d{2}/\d{2}',  # YYYY/MM/DD
            r'^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}',  # YYYY-MM-DD HH:MM
        ]
    
    @execution_time
    def infer_types(self, df: pd.DataFrame, exclude_types: List[str] = None) -> List[Dict[str, str]]:
        """
        DataFrame의 모든 컬럼 타입을 추론
        
        Args:
            df: pandas DataFrame
            exclude_types: 제외할 타입 리스트 (예: ["string", "datetime"])
        
        Returns:
            List[Dict[str, str]]: [{"name": "col1", "type": "integer"}, ...]
        """
        if exclude_types is None:
            exclude_types = []
        
        inferred_columns = []
        
        for col in df.columns:
            inferred_type = self._infer_single_column(df[col])
            
            # 제외할 타입이 아닌 경우만 포함
            if inferred_type not in exclude_types:
                inferred_columns.append({"name": col, "type": inferred_type})
        
        return inferred_columns
    
    def _infer_single_column(self, series: pd.Series) -> str:
        """단일 컬럼의 타입 추론"""
        # 1. 비어있으면 string
        if len(series) == 0:
            return "string"
        
        # 2. 샘플링으로 빠른 추론
        sample_data = self._get_sample(series)
        
        # 3. Pandas dtype 기반 빠른 판단
        dtype_str = str(sample_data.dtype)
        
        if dtype_str.startswith('int'):
            return "integer"
        elif dtype_str.startswith('float'):
            return self._check_float_type(sample_data)
        elif dtype_str == 'bool':
            return "boolean"
        elif dtype_str.startswith('datetime'):
            return "datetime"
        else:
            # object 타입 세부 분석
            return self._analyze_object_type(sample_data)
    
    def _get_sample(self, series: pd.Series) -> pd.Series:
        """효율적인 샘플링"""
        if len(series) <= self.sample_size:
            return series
        
        # 처음 100개 + 랜덤 샘플
        sample_indices = list(range(min(100, len(series))))
        
        if len(series) > self.sample_size:
            remaining_size = min(self.sample_size - 100, len(series) - 100)
            if remaining_size > 0:
                remaining_indices = np.random.choice(
                    range(100, len(series)), 
                    size=remaining_size, 
                    replace=False
                )
                sample_indices.extend(remaining_indices)
        
        return series.iloc[sample_indices]
    
    def _check_float_type(self, series: pd.Series) -> str:
        """float 타입의 세부 분석"""
        has_nan = series.isna().any()
        
        if not has_nan:
            # NaN이 없는 경우 정수성 체크
            sample = series.head(100)
            if len(sample) > 0 and all(sample.apply(lambda x: float(x).is_integer())):
                return "integer"
        
        return "double"
    
    def _analyze_object_type(self, series: pd.Series) -> str:
        """object 타입 세부 분석"""
        clean_series = series.dropna()
        if len(clean_series) == 0:
            return "string"
        
        # 작은 샘플로 빠른 체크
        sample = clean_series.head(50)
        
        # 1. 불리언 체크 (가장 빠름)
        if self._is_boolean(sample):
            return "boolean"
        
        # 2. datetime 체크
        if self._is_datetime(sample):
            return "datetime"
        
        # 3. 숫자 문자열 체크
        if self._is_numeric_string(sample):
            return self._check_numeric_string_type(sample)
        
        return "string"
    
    def _is_boolean(self, sample: pd.Series) -> bool:
        """불리언 타입 체크"""
        unique_values = set(sample.unique())
        return len(unique_values) <= 10 and unique_values.issubset(self.boolean_values)
    
    def _is_datetime(self, sample: pd.Series) -> bool:
        """datetime 타입 체크"""
        # 패턴 매칭 먼저 시도
        sample_str = sample.astype(str).head(10)
        
        for pattern in self.datetime_patterns:
            if sample_str.str.match(pattern).any():
                # 패턴이 매치되면 실제 변환 시도
                try:
                    pd.to_datetime(sample.head(5), errors='raise')
                    return True
                except:
                    continue
        
        return False
    
    def _is_numeric_string(self, sample: pd.Series) -> bool:
        """숫자 문자열인지 체크"""
        try:
            pd.to_numeric(sample.head(10), errors='raise')
            return True
        except:
            return False
    
    def _check_numeric_string_type(self, sample: pd.Series) -> str:
        """숫자 문자열의 타입 결정"""
        try:
            numeric_sample = pd.to_numeric(sample.head(20))
            
            # 정수성 체크
            if all(numeric_sample.apply(lambda x: float(x).is_integer())):
                return "integer"
            else:
                return "double"
        except:
            return "string"

def process_columns_with_inference(df: pd.DataFrame, 
                                 exclude_types: List[str] = None,
                                 sample_size: int = 1000) -> tuple:
    """
    컬럼 타입 추론과 필터링을 동시에 처리
    
    Returns:
        tuple: (filtered_df, inferred_columns, valid_columns_mapping)
    """
    if exclude_types is None:
        pass
    
    # 타입 추론기 생성
    inferrer = ColumnTypeInferrer(sample_size=sample_size)
    
    # 모든 컬럼 타입 추론
    all_columns = inferrer.infer_types(df, exclude_types=[])
    
    # 유효한 컬럼만 필터링
    valid_columns = {}
    inferred_columns = []
    
    for col_info in all_columns:
        col_name = col_info["name"]
        col_type = col_info["type"]
        
        if col_type not in exclude_types:
            cleaned_name = clean_column_name(col_name)
            valid_columns[col_name] = cleaned_name
            inferred_columns.append({"name": cleaned_name, "type": col_type})
    
    # 필터링된 DataFrame 생성
    if valid_columns:
        df_filtered = df[list(valid_columns.keys())].copy()
        df_filtered.rename(columns=valid_columns, inplace=True)
    else:
        df_filtered = pd.DataFrame()
    
    return df_filtered, inferred_columns, valid_columns