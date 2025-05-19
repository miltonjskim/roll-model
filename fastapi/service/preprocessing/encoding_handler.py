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
        
    def _check_column_exists(self, column):
        """
        컬럼 존재 여부 확인
        
        Parameters:
        -----------
        column : str
            확인할 컬럼 이름
            
        Raises:
        -------
        CustomAPIException
            컬럼이 존재하지 않는 경우
        """
        if column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_002",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )
            
    def _check_missing_values(self, column, context=""):
        """
        결측치 확인
        
        Parameters:
        -----------
        column : str
            확인할 컬럼 이름
        context : str, optional
            에러 메시지에 추가할 컨텍스트
            
        Raises:
        -------
        CustomAPIException
            컬럼에 결측치가 있는 경우
        """
        if self.df[column].isnull().any():
            error_message = f"컬럼 '{column}'에 결측치가 있어 {context} 인코딩이 불가능합니다."
            if context:
                error_message += " 먼저 결측치를 처리해주세요."
                
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_003",
                message=error_message
            )
    
    def _check_category_count_for_onehot(self, column, max_categories=30):
        """
        원-핫 인코딩을 위한 범주 개수 확인
        
        Parameters:
        -----------
        column : str
            확인할 컬럼 이름
        max_categories : int, default=30
            허용되는 최대 범주 개수
            
        Raises:
        -------
        CustomAPIException
            범주 개수가 너무 많은 경우
        """
        unique_count = self.df[column].nunique()
        if unique_count > max_categories:
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_008",
                message=f"컬럼 '{column}'의 고유 범주 개수({unique_count})가 너무 많습니다. 원-핫 인코딩은 범주 개수가 {max_categories}개 이하인 컬럼에만 적용 가능합니다. 레이블 인코딩을 사용하세요."
            )
            
    def _get_categorical_columns(self):
        """
        범주형 컬럼 목록 반환
        
        Returns:
        --------
        list
            범주형 컬럼 목록
        """
        # 객체형 컬럼 필터링 (문자열 등의 범주형 데이터)
        object_columns = self.df.select_dtypes(include=['object']).columns.tolist()
        
        # 카디널리티가 낮은 숫자형 컬럼도 범주형으로 취급
        numeric_columns = self.df.select_dtypes(include=['number']).columns.tolist()
        low_cardinality_numeric = []
        
        for col in numeric_columns:
            if self.df[col].nunique() < 10 and self.df[col].nunique() > 1:  # 10개 미만의 유니크값
                low_cardinality_numeric.append(col)
                
        # 범주형으로 취급할 수 있는 컬럼들
        categorical_columns = object_columns + low_cardinality_numeric
        
        if not categorical_columns:
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_005",
                message="인코딩 가능한 범주형 컬럼이 없습니다."
            )
            
        return categorical_columns
    
    def encode_onehot(self, column=None, max_categories=30):
        """
        원-핫 인코딩 적용

        Parameters:
        -----------
        column : str, optional
            인코딩할 컬럼 이름. None인 경우 모든 범주형 컬럼에 적용
        max_categories : int, default=30
            허용되는 최대 범주 개수

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 특정 컬럼이 지정된 경우
        if column is not None:
            self._check_column_exists(column)
            self._check_missing_values(column, "ONE_HOT")
            self._check_category_count_for_onehot(column, max_categories)
            
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
            result = {
                "encodingType": "ONE_HOT",
                "column": column,
                "categories": categories,
                "newColumns": new_columns,
                "affectedRows": affected_rows,
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0 
            }
            
            return result
        
        # 전체 범주형 컬럼에 대해 처리하는 경우
        else:
            # 범주형 컬럼 목록 가져오기
            categorical_columns = self._get_categorical_columns()
            
            # 각 컬럼별 처리 결과
            all_results = []
            all_new_columns = []
            processed_columns = []
            skipped_columns = []
            
            # 각 컬럼에 대해 처리
            for col in categorical_columns:
                try:
                    # 결측치 확인
                    if self.df[col].isnull().any():
                        skipped_columns.append({
                            "column": col,
                            "reason": "결측치가 있어 처리가 불가능합니다."
                        })
                        continue
                    
                    # 범주 개수 확인
                    unique_count = self.df[col].nunique()
                    if unique_count > max_categories:
                        skipped_columns.append({
                            "column": col,
                            "reason": f"고유 범주 개수({unique_count})가 너무 많습니다. 최대 {max_categories}개까지 허용됩니다."
                        })
                        continue
                    
                    # 범주 추출
                    categories = sorted(self.df[col].unique().tolist())
                    
                    # 원-핫 인코딩 적용
                    df_encoded = pd.get_dummies(self.df, columns=[col], prefix=col)
                    self.df = df_encoded
                    
                    # 새로 생성된 컬럼 이름들
                    new_columns = [c for c in df_encoded.columns if c.startswith(f"{col}_")]
                    all_new_columns.extend(new_columns)
                    
                    # 처리 결과 저장
                    all_results.append({
                        "column": col,
                        "categories": categories,
                        "newColumns": new_columns
                    })
                    
                    processed_columns.append(col)
                    
                except Exception as e:
                    skipped_columns.append({
                        "column": col,
                        "reason": str(e)
                    })
                    continue
            
            # 처리된 컬럼이 없는 경우
            if not processed_columns:
                raise CustomAPIException(
                    status_code=400,
                    error_code="ENCODING_006",
                    message="모든 범주형 컬럼에 대해 원-핫 인코딩을 적용할 수 없습니다."
                )
            
            # 전체 결과 구성
            result = {
                "encodingType": "ONE_HOT",
                "columns": processed_columns,
                "newColumns": all_new_columns,
                "affectedRows": len(self.df),
                "details": all_results,
                "skippedColumns": skipped_columns if skipped_columns else None,
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0
            }
            
            return result
        
    def encode_label(self, column=None):
        """
        레이블 인코딩 적용

        Parameters:
        -----------
        column : str, optional
            인코딩할 컬럼 이름. None인 경우 모든 범주형 컬럼에 적용

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 특정 컬럼이 지정된 경우
        if column is not None:
            self._check_column_exists(column)
            self._check_missing_values(column, "LABEL")
            
            # 범주 추출 및 정렬
            categories = sorted(self.df[column].unique().tolist())
            
            # 레이블 매핑 생성
            label_mapping = {cat: idx for idx, cat in enumerate(categories)}
            
            # 레이블 인코딩 적용
            self.df[column] = self.df[column].map(label_mapping)
            
            # 영향받은 행 수
            affected_rows = len(self.df)
            
            # 결과 구성
            result = {
                "encodingType": "LABEL",
                "column": column,
                "mapping": label_mapping,
                "affectedRows": affected_rows,
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0
            }
            
            return result
        
        # 전체 범주형 컬럼에 대해 처리하는 경우
        else:
            # 범주형 컬럼 목록 가져오기
            categorical_columns = self._get_categorical_columns()
            
            # 각 컬럼별 처리 결과
            all_results = []
            processed_columns = []
            all_mappings = {}
            
            # 각 컬럼에 대해 처리
            for col in categorical_columns:
                try:
                    # 결측치 확인 및 스킵
                    if self.df[col].isnull().any():
                        continue
                        
                    # 범주 추출 및 정렬
                    categories = sorted(self.df[col].unique().tolist())
                    
                    # 레이블 매핑 생성
                    label_mapping = {cat: idx for idx, cat in enumerate(categories)}
                    
                    # 레이블 인코딩 적용
                    self.df[col] = self.df[col].map(label_mapping)
                    
                    # 처리 결과 저장
                    all_results.append({
                        "column": col,
                        "mapping": label_mapping
                    })
                    
                    all_mappings[col] = label_mapping
                    processed_columns.append(col)
                    
                except Exception as e:
                    # 컬럼 처리 중 오류 발생 시 다음 컬럼으로 진행
                    continue
            
            # 처리된 컬럼이 없는 경우
            if not processed_columns:
                raise CustomAPIException(
                    status_code=400,
                    error_code="ENCODING_006",
                    message="모든 범주형 컬럼에 대해 레이블 인코딩을 적용할 수 없습니다."
                )
            
            # 전체 결과 구성
            result = {
                "encodingType": "LABEL",
                "columns": processed_columns,
                "mappings": all_mappings,
                "affectedRows": len(self.df),
                "details": all_results,
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0
            }
            
            return result
    
    def encode_target(self, column=None, target_column=None):
        """
        타겟 인코딩 적용

        Parameters:
        -----------
        column : str, optional
            인코딩할 컬럼 이름. None인 경우 모든 범주형 컬럼에 적용
        target_column : str
            타겟 컬럼 이름

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 타겟 컬럼 유효성 검사
        if target_column is None:
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_007",
                message="타겟 인코딩에는 반드시 타겟 컬럼을 지정해야 합니다."
            )
            
        self._check_column_exists(target_column)
        self._check_missing_values(target_column, "target")
        
        # 타겟 컬럼이 이진값인지 확인 (0/1 또는 True/False)
        unique_targets = self.df[target_column].unique()
        is_binary = len(unique_targets) == 2 and set(unique_targets).issubset({0, 1, True, False})
        
        # 타겟 컬럼이 이진값이 아니고 숫자형도 아닌 경우
        if not is_binary and not pd.api.types.is_numeric_dtype(self.df[target_column]):
            raise CustomAPIException(
                status_code=400,
                error_code="ENCODING_004",
                message=f"타겟 컬럼 '{target_column}'이 이진값이 아니고 숫자형도 아닙니다."
            )
        
        # 특정 컬럼이 지정된 경우
        if column is not None:
            self._check_column_exists(column)
            self._check_missing_values(column, "TARGET")
            
            # 타겟 인코딩 계산
            target_encoding = self.df.groupby(column)[target_column].mean().to_dict()
            
            # 타겟 인코딩 적용
            self.df[column] = self.df[column].map(target_encoding)
            
            # 영향받은 행 수
            affected_rows = len(self.df)
            
            # 결과 구성
            result = {
                "encodingType": "TARGET",
                "column": column,
                "targetColumn": target_column,
                "mapping": {k: float(v) for k, v in target_encoding.items()},
                "affectedRows": affected_rows,
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0 
            }
            
            return result
        
        # 전체 범주형 컬럼에 대해 처리하는 경우
        else:
            # 범주형 컬럼 목록 가져오기 (타겟 컬럼 제외)
            categorical_columns = self._get_categorical_columns()
            if target_column in categorical_columns:
                categorical_columns.remove(target_column)
                
            if not categorical_columns:
                raise CustomAPIException(
                    status_code=400,
                    error_code="ENCODING_005",
                    message="인코딩 가능한 범주형 컬럼이 없습니다."
                )
            
            # 각 컬럼별 처리 결과
            all_results = []
            processed_columns = []
            all_mappings = {}
            
            # 각 컬럼에 대해 처리
            for col in categorical_columns:
                try:
                    # 결측치 확인 및 스킵
                    if self.df[col].isnull().any():
                        continue
                        
                    # 타겟 인코딩 계산
                    target_encoding = self.df.groupby(col)[target_column].mean().to_dict()
                    
                    # 타겟 인코딩 적용
                    self.df[col] = self.df[col].map(target_encoding)
                    
                    # 처리 결과 저장
                    all_results.append({
                        "column": col,
                        "mapping": {k: float(v) for k, v in target_encoding.items()}
                    })
                    
                    all_mappings[col] = {k: float(v) for k, v in target_encoding.items()}
                    processed_columns.append(col)
                    
                except Exception as e:
                    # 컬럼 처리 중 오류 발생 시 다음 컬럼으로 진행
                    continue
            
            # 처리된 컬럼이 없는 경우
            if not processed_columns:
                raise CustomAPIException(
                    status_code=400,
                    error_code="ENCODING_006",
                    message="모든 범주형 컬럼에 대해 타겟 인코딩을 적용할 수 없습니다."
                )
            
            # 전체 결과 구성
            result = {
                "encodingType": "TARGET",
                "columns": processed_columns,
                "targetColumn": target_column,
                "mappings": all_mappings,
                "affectedRows": len(self.df),
                "details": all_results,
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": 0
            }
            
            return result