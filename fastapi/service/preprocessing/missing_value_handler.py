import os
import json
import pandas as pd
from datetime import datetime

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
            raise ValueError("데이터 파일 경로 또는 데이터프레임을 제공해야 합니다.")
            
        # 데이터 처리 히스토리 저장
        self.history = []
        # 원본 데이터 백업
        self.original_df = self.df.copy()
        
        # 결과 저장 디렉토리 생성
        self.result_dir = 'preprocessing_results'
        os.makedirs(self.result_dir, exist_ok=True)
    
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
    
    def handle_missing_values(self, column, method='mean', save_history=True):
        """
        선택한 컬럼의 결측치 처리
        
        Parameters:
        -----------
        column : str
            처리할 컬럼 이름
        method : str, default='mean'
            대체 방법 ('mean', 'median', 'mode')
        save_history : bool, default=True
            처리 히스토리 저장 여부
            
        Returns:
        --------
        dict
            처리 결과 정보
        """
        if column not in self.df.columns:
            return {"error": f"컬럼 '{column}'이 데이터에 존재하지 않습니다."}
            
        # 결측치가 있는 행 인덱스 저장
        missing_indices = self.df[self.df[column].isnull()].index.tolist()
        
        if not missing_indices:
            return {"error": f"컬럼 '{column}'에 결측치가 없습니다."}
            
        # 원래 데이터의 복사본 저장
        original_rows = self.df.loc[missing_indices].copy()
        
        # 데이터 타입 확인
        is_numeric = pd.api.types.is_numeric_dtype(self.df[column])
        
        # 결측치 대체 방법에 따라 처리
        if method == 'mean':
            if not is_numeric:
                return {"error": f"'{column}' 컬럼은 숫자형이 아니므로 평균값 대체가 불가능합니다."}
            fill_value = self.df[column].mean()
            description = f"{column} 컬럼의 결측치를 평균값({fill_value:.2f})으로 대체"
        elif method == 'median':
            if not is_numeric:
                return {"error": f"'{column}' 컬럼은 숫자형이 아니므로 중앙값 대체가 불가능합니다."}
            fill_value = self.df[column].median()
            description = f"{column} 컬럼의 결측치를 중앙값({fill_value:.2f})으로 대체"
        elif method == 'mode':
            fill_value = self.df[column].mode()[0]
            description = f"{column} 컬럼의 결측치를 최빈값({fill_value})으로 대체"
        else:
            return {"error": "유효하지 않은 대체 방법입니다. 'mean', 'median', 'mode' 중 하나를 사용하세요."}
            
        # 결측치 대체
        self.df[column].fillna(fill_value, inplace=True)
        
        # 변경된 행
        changed_rows = self.df.loc[missing_indices].copy()
        
        # 처리 결과
        result = {
            "column": column,
            "method": method,
            "fill_value": str(fill_value) if not isinstance(fill_value, (int, float)) else float(fill_value) if not pd.isna(fill_value) else None,
            "changed_indices": missing_indices,
            "original_rows": original_rows.to_dict('records'),
            "changed_rows": changed_rows.to_dict('records'),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # 히스토리 저장
        if save_history:
            self.history.append(result)
            # 결과 파일 저장
            self._save_result(result)
            
        return result
    
    def undo_last_operation(self):
        """가장 최근 처리 작업 취소"""
        if not self.history:
            return {"error": "취소할 작업이 없습니다."}
            
        # 가장 최근 작업 가져오기
        last_op = self.history.pop()
        column = last_op["column"]
        indices = last_op["changed_indices"]
        
        # 원래 값으로 복원
        for idx, row in enumerate(last_op["original_rows"]):
            self.df.loc[indices[idx], column] = row[column]
            
        return {
            "message": f"{column} 컬럼의 결측치 처리가 취소되었습니다.",
            "restored_rows": last_op["original_rows"]
        }
    
    def get_current_data(self):
        """현재 데이터프레임 반환"""
        return self.df.copy()
    
    def get_history(self):
        """처리 히스토리 반환"""
        return self.history
    
    def reset_to_original(self):
        """원본 데이터로 초기화"""
        self.df = self.original_df.copy()
        self.history = []
        return {"message": "데이터가 원본 상태로 초기화되었습니다."}
    
    def _save_result(self, result):
        """처리 결과 저장"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.result_dir}/missing_value_{result['column']}_{result['method']}_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        return filename
    
    def save_dataframe(self, filename=None):
        """현재 데이터프레임 저장"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{self.result_dir}/processed_data_{timestamp}.csv"
            
        self.df.to_csv(filename, index=False)
        return {"message": f"데이터가 '{filename}'에 저장되었습니다."}
    
    def export_as_json(self):
        """현재 데이터프레임을 JSON 형식으로 변환"""
        return {
            "data": self.df.to_dict('records'),
            "columns": list(self.df.columns),
            "shape": self.df.shape,
            "missing_info": self.get_missing_info()
        }