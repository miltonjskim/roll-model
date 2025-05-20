import pandas as pd
from datetime import datetime
from core.exception import CustomAPIException
import io

class MissingValueHandler:
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
                error_code="MISSING_VALUE_001",
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
                error_code="MISSING_VALUE_002",
                message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )
            
    def _get_missing_indices(self, column=None):
        """
        결측치가 있는 행 인덱스 반환
        
        Parameters:
        -----------
        column : str, optional
            처리할 컬럼 이름. None인 경우 전체 데이터에 적용
            
        Returns:
        --------
        list
            결측치가 있는 행 인덱스 목록
        """
        if column is not None:
            # 특정 컬럼의 결측치 인덱스
            return self.df[self.df[column].isnull()].index.tolist()
        else:
            # 전체 데이터의 결측치 인덱스
            return self.df[self.df.isnull().any(axis=1)].index.tolist()
    
    def _check_missing_values_exist(self, column=None):
        """
        결측치 존재 여부 확인
        
        Parameters:
        -----------
        column : str, optional
            처리할 컬럼 이름. None인 경우 전체 데이터에 적용
            
        Returns:
        --------
        int
            결측치 개수
            
        Raises:
        -------
        CustomAPIException
            결측치가 없는 경우
        """
        if column is None:
            # 전체 데이터의 결측치 개수
            missing_count = self.df.isnull().sum().sum()
            error_message = "데이터에 결측치가 없습니다."
        else:
            # 특정 컬럼의 결측치 개수
            missing_count = self.df[column].isnull().sum()
            error_message = f"컬럼 '{column}'에 결측치가 없습니다."
            
        if missing_count == 0:
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_003",
                message=error_message
            )
            
        return missing_count
    
    def _get_columns_with_missing_values(self):
        """
        결측치가 있는 모든 컬럼 이름 반환
        
        Returns:
        --------
        list
            결측치가 있는 컬럼 목록
        """
        return [col for col in self.df.columns if self.df[col].isnull().any()]
    
    def _validate_imputation_method(self, column, method):
        """
        대체 방법 유효성 검증
        
        Parameters:
        -----------
        column : str
            처리할 컬럼 이름
        method : str
            대체 방법 ('MEAN', 'MEDIAN', 'MODE')
            
        Returns:
        --------
        object
            대체할 값
        """
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
            
        return fill_value
    
    def _validate_remove_method(self, method):
        """
        제거 방법 유효성 검증
        
        Parameters:
        -----------
        method : str
            제거 방법 ('ROW_REMOVE', 'COL_REMOVE')
            
        Raises:
        -------
        CustomAPIException
            유효하지 않은 제거 방법인 경우
        """
        if method not in ['ROW_REMOVE', 'COL_REMOVE']:
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_008",
                message=f"지원하지 않는 제거 방법입니다: {method}. 'ROW_REMOVE' 또는 'COL_REMOVE'를 사용하세요."
            )

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

    def handle_missing_values_imputation(self, column=None, method='MEAN'):
        """
        결측치 대체 처리

        Parameters:
        -----------
        column : str, optional
            처리할 컬럼 이름. None인 경우 모든 컬럼에 대해 처리
        method : str, default='MEAN'
            대체 방법 ('MEAN', 'MEDIAN', 'MODE')

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 특정 컬럼이 지정된 경우
        if column is not None:
            # 컬럼 존재 여부 확인
            self._check_column_exists(column)
            
            # 결측치 확인
            missing_count = self._check_missing_values_exist(column)
            
            # 결측치가 있는 행 인덱스 저장
            missing_indices = self._get_missing_indices(column)
            
            # 원래 데이터의 복사본 저장
            original_rows = self.df.loc[missing_indices].copy()

            # 대체 방법 검증 및 대체값 계산
            fill_value = self._validate_imputation_method(column, method)

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
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": missing_indices[0] if missing_indices else 0 
            }

            return result
        
        # 전체 컬럼에 대해 처리하는 로직 (추가된 부분)
        else:
            # 결측치가 있는 컬럼 목록 가져오기
            columns_with_missing = self._get_columns_with_missing_values()
            
            if not columns_with_missing:
                raise CustomAPIException(
                    status_code=400,
                    error_code="MVH_003",
                    message="데이터에 결측치가 없습니다."
                )
            
            # 전체 결측치 개수
            total_missing_count = self.df.isnull().sum().sum()
            
            # 모든 결측치가 있는 행 인덱스
            all_missing_indices = self._get_missing_indices()
            
            # 각 컬럼별 처리 결과
            all_results = []
            all_imputed_rows = {}
            all_original_rows = {}
            
            # 각 컬럼별로 처리
            for col in columns_with_missing:
                try:
                    # 해당 컬럼의 결측치 인덱스
                    col_missing_indices = self._get_missing_indices(col)
                    
                    if not col_missing_indices:
                        continue
                    
                    # 데이터 타입에 따른 적절한 대체 방법 선택
                    is_numeric = pd.api.types.is_numeric_dtype(self.df[col])
                    
                    # 숫자형이 아닌 경우 MODE로 대체
                    col_method = method if is_numeric else 'MODE'
                    
                    try:
                        # 대체값 계산
                        if col_method == 'MEAN' and is_numeric:
                            fill_value = self.df[col].mean()
                        elif col_method == 'MEDIAN' and is_numeric:
                            fill_value = self.df[col].median()
                        else:  # MODE
                            fill_value = self.df[col].mode()[0]
                        
                        # 원본 값 저장
                        original_values = self.df.loc[col_missing_indices, col].copy()
                        all_original_rows[col] = original_values
                        
                        # 결측치 대체
                        self.df[col].fillna(fill_value, inplace=True)
                        
                        # 대체된 값 저장
                        imputed_values = self.df.loc[col_missing_indices, col].copy()
                        all_imputed_rows[col] = imputed_values
                        
                        # 컬럼별 결과 저장
                        all_results.append({
                            "column": col,
                            "method": col_method,
                            "missingCount": len(col_missing_indices),
                            "fillValue": float(fill_value) if isinstance(fill_value, (int, float)) else str(fill_value),
                            "missingIndices": col_missing_indices
                        })
                        
                    except Exception as e:
                        # 특정 컬럼 처리 실패 시 다음 컬럼으로 진행
                        continue
                
                except Exception as e:
                    # 컬럼 처리 중 오류 발생 시 다음 컬럼으로 진행
                    continue
            
            # 처리된 컬럼이 없는 경우
            if not all_results:
                raise CustomAPIException(
                    status_code=400,
                    error_code="MVH_009",
                    message="모든 컬럼에서 결측치 처리를 수행할 수 없습니다."
                )
            
            # 모든 결측치 인덱스 정렬
            sorted_missing_indices = sorted(all_missing_indices)
            
            # 원본 행과 대체된 행 구성
            original_rows_records = {}
            imputed_rows_records = {}
            
            for idx in sorted_missing_indices:
                original_row = {}
                imputed_row = {}
                
                for col in all_original_rows:
                    if idx in all_original_rows[col].index:
                        original_row[col] = all_original_rows[col][idx]
                        
                for col in all_imputed_rows:
                    if idx in all_imputed_rows[col].index:
                        imputed_row[col] = all_imputed_rows[col][idx]
                
                if original_row:
                    original_rows_records[idx] = original_row
                if imputed_row:
                    imputed_rows_records[idx] = imputed_row
            
            # 전체 결과 생성
            result = {
                "column": "all_columns",  # 전체 컬럼을 의미
                "method": method,
                "missingCount": total_missing_count,
                "imputedCount": total_missing_count,
                "missingIndices": sorted_missing_indices,
                "originalRows": original_rows_records,
                "imputedRows": imputed_rows_records,
                "details": all_results,  # 각 컬럼별 상세 결과
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": sorted_missing_indices[0] if sorted_missing_indices else 0
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
        if column is not None:
            self._check_column_exists(column)
        
        # 결측치 확인
        missing_count = self._check_missing_values_exist(column)
        
        # 제거 방법 검증
        self._validate_remove_method(method)
        
        # 결측치가 있는 행 또는 열 찾기
        missing_indices = []
        removed_rows = []
        removed_columns = []

        if method == 'ROW_REMOVE':
            # 결측치가 있는 행 인덱스
            missing_indices = self._get_missing_indices(column)
            
            # 제거 전 원본 행 저장
            removed_rows = self.df.loc[missing_indices].copy().to_dict('records')

            # 행 제거
            self.df = self.df.drop(missing_indices)

        elif method == 'COL_REMOVE':
            if column is None:
                # 결측치가 있는 모든 열 이름
                removed_columns = self._get_columns_with_missing_values()
            else:
                # 특정 컬럼에 결측치가 있는 경우만 제거
                if self.df[column].isnull().any():
                    removed_columns = [column]
                else:
                    removed_columns = []

            # 열 제거
            if removed_columns:
                self.df = self.df.drop(columns=removed_columns)

        # API 응답 형식에 맞게 결과 구성
        result = {
            "column": column,  # 처리된 컬럼 (None이면 전체)
            "method": method,
            "missingCount": int(missing_count),
            "removedCount": len(missing_indices) if method == 'ROW_REMOVE' else len(removed_columns),
            "missingIndices": missing_indices,
            "removedRows": removed_rows,
            "removedColumns": removed_columns,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "startPoint": missing_indices[0] if missing_indices else 0 
        }

        return result