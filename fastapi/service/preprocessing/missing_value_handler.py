import pandas as pd
from datetime import datetime

from core.exception import CustomAPIException


class MissingValueHandler:
    def __init__(self, data_path=None, df=None):
        """
        결측치 처리 클래스 초기화
        
        Parameters:
        -----------
        data_path : str, optional
            데이터 파일 경로
        df : pandas.DataFrame, optional
            직접 데이터프레임 전달 시 사용
        """
        if df is not None:
            self.df = df.copy()
        elif data_path is not None:
            self.df = pd.read_csv(data_path)
        else:
            raise CustomAPIException(
                status_code=400,
                error_code="MISSING_VALUE_001",
                message=f"데이터 파일 경로 또는 데이터프레임을 제공해야 합니다."
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
    
    def handle_missing_values_imputation(self, column, method='mean'):
        """
        선택한 컬럼의 결측치 처리
        
        Parameters:
        -----------
        column : str
            처리할 컬럼 이름
        method : str, default='mean'
            대체 방법 ('mean', 'median', 'mode')
            
        Returns:
        --------
        dict
            처리 결과 정보
        """
        if column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="MISSING_VALUE_002",
                message=f"컬럼 '{column}'에 데이터에 존재하지 않습니다."
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
        
        # 데이터 타입 확인
        is_numeric = pd.api.types.is_numeric_dtype(self.df[column])
        
        # 결측치 대체 방법에 따라 처리
        if method == 'MEAN':
            if not is_numeric:
                raise CustomAPIException(
                    status_code=400,
                    error_code="MVH_004",
                    message= f"'{column}' 컬럼은 숫자형이 아니므로 평균값 대체가 불가능합니다."
                )
            fill_value = self.df[column].mean()
            description = f"{column} 컬럼의 결측치를 평균값({fill_value:.2f})으로 대체"
        elif method == 'MEDIAN':
            if not is_numeric:
                raise CustomAPIException(
                    status_code=400,
                    error_code="MVH_005",
                    message=f"'{column}' 컬럼은 숫자형이 아니므로 중앙값 대체가 불가능합니다."
                )
            fill_value = self.df[column].median()
            description = f"{column} 컬럼의 결측치를 중앙값({fill_value:.2f})으로 대체"
        elif method == 'MODE':
            fill_value = self.df[column].mode()[0]
            description = f"{column} 컬럼의 결측치를 최빈값({fill_value})으로 대체"
        else:
            fill_value = method
            
        # 결측치 대체
        self.df[column].fillna(fill_value, inplace=True)
        
        # 변경된 행
        changed_rows = self.df.loc[missing_indices].copy()
        
        # 처리 결과
        result = {
            "data": self.df,
            "column": column,
            "method": method,
            "fill_value": str(fill_value) if not isinstance(fill_value, (int, float)) else float(fill_value) if not pd.isna(fill_value) else None,
            "changed_indices": missing_indices,
            "original_rows": original_rows.to_dict('records'),
            "changed_rows": changed_rows.to_dict('records'),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
            
        return result

    def handle_missing_values_remove(self, method='ROW_REMOVE'):
        """
        결측치가 포함된 행 또는 열 제거

        Parameters:
        -----------
        method : str, default='ROW_REMOVE'
            제거 방법 ('ROW_REMOVE': 행 제거, 'COL_REMOVE': 열 제거)

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 결측치 개수 확인
        original_missing_count = self.df.isnull().sum().sum()

        if original_missing_count == 0:
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_006",
                message="데이터에 결측치가 없습니다."
            )

        # 결측치가 있는 행 또는 열 찾기
        missing_indices = []
        imputed_rows = []
        imputed_columns = []

        if method == 'ROW_REMOVE':
            # 결측치가 있는 행 인덱스
            missing_indices = self.df[self.df.isnull().any(axis=1)].index.tolist()

            # 제거 전 원본 행 저장
            imputed_rows = self.df.loc[missing_indices].copy().to_dict('records')

            # 행 제거
            self.df = self.df.dropna(axis=0)

        elif method == 'COL_REMOVE':
            # 결측치가 있는 열 이름
            imputed_columns = [col for col in self.df.columns if self.df[col].isnull().any()]

            # 열 제거
            self.df = self.df.dropna(axis=1)

        else:
            raise CustomAPIException(
                status_code=400,
                error_code="MVH_007",
                message=f"지원하지 않는 제거 방법입니다: {method}. 'ROW_REMOVE' 또는 'COL_REMOVE'를 사용하세요."
            )

        # 결측치 처리 후 남은 결측치 개수
        remaining_missing_count = self.df.isnull().sum().sum()
        imputed_count = original_missing_count - remaining_missing_count

        # 결과 구성
        result = {
            "method": method,
            "changedIndices": missing_indices,
            "imputedRows": imputed_rows,
            "imputedColumns": imputed_columns,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        }

        # 전체 응답 구조 (메서드에서는 data 부분만 반환)
        response_data = {
            "pipelineId": None,  # 외부에서 설정해야 할 값
            "success": True,
            "message": "결측치 처리 완료",
            "originalMissingCount": int(original_missing_count),
            "imputedCount": int(imputed_count),
            "result": result
        }

        return response_data