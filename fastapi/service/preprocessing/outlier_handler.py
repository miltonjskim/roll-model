from datetime import datetime
import logging
import pandas as pd
import numpy as np
from scipy import stats

from core.exception import CustomAPIException

logger = logging.getLogger()


class OutlierHandler:
    def __init__(self, data_path=None, df=None, encoding="utf-8"):
        if df is not None:
            self.df = df.copy()
        elif data_path is not None:
            self.df = pd.read_csv(data_path, encoding=encoding)
        else:
            raise ValueError("데이터 파일 경로 또는 데이터프레임을 제공해야 합니다.")

        # 데이터 처리 히스토리 저장
        self.history = []
        # 원본 데이터 백업
        self.original_df = self.df.copy()

    def _get_numeric_columns(self):
        """
        데이터프레임에서 숫자형 컬럼만 추출
        
        Returns:
        --------
        list
            숫자형 컬럼 목록
        """
        numeric_columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
        
        if not numeric_columns:
            raise CustomAPIException(
                status_code=400,
                error_code="OUTLIER_007",
                message="숫자형 컬럼이 없어 이상치 처리가 불가능합니다.",
            )
            
        return numeric_columns

    def _detect_outliers_for_column(self, column, detection, threshold):
        """
        단일 컬럼에 대한 이상치 탐지
        
        Parameters:
        -----------
        column : str
            이상치를 탐지할 컬럼 이름
        detection : str
            탐지 방법 ('IQR', 'ZSCORE')
        threshold : float
            Z-score 임계값 또는 IQR 승수
            
        Returns:
        --------
        dict
            이상치 탐지 결과
        """
        if detection == "IQR":
            detection_result = self.detect_outliers_iqr(column, multiplier=threshold)
        elif detection == "ZSCORE":
            detection_result = self.detect_outliers_zscore(column, threshold=threshold)
        else:
            raise CustomAPIException(
                status_code=400,
                error_code="OUTLIER_001",
                message="유효하지 않은 탐지 방법입니다. 'IQR' 또는 'ZSCORE'를 사용하세요.",
            )
            
        if "error" in detection_result:
            return None
            
        return detection_result

    def _calculate_thresholds(self, detection_result, detection, threshold):
        """
        탐지 결과에서 임계값 계산
        
        Parameters:
        -----------
        detection_result : dict
            이상치 탐지 결과
        detection : str
            탐지 방법 ('IQR', 'ZSCORE')
        threshold : float
            Z-score 임계값 또는 IQR 승수
            
        Returns:
        --------
        tuple
            (min_threshold, max_threshold)
        """
        if detection == "IQR":
            min_threshold = detection_result.get("lowerBound")
            max_threshold = detection_result.get("upperBound")
        else:  # ZSCORE
            mean = detection_result["mean"]
            std = detection_result["std"]
            min_threshold = mean - threshold * std
            max_threshold = mean + threshold * std
            
        return float(min_threshold), float(max_threshold)

    def _detect_outliers_for_all_columns(self, detection, threshold):
        """
        모든 숫자형 컬럼에 대한 이상치 탐지
        
        Parameters:
        -----------
        detection : str
            탐지 방법 ('IQR', 'ZSCORE')
        threshold : float
            Z-score 임계값 또는 IQR 승수
            
        Returns:
        --------
        tuple
            (all_results, all_outlier_indices, total_outlier_count)
        """
        numeric_columns = self._get_numeric_columns()
        all_results = []
        total_outlier_count = 0
        all_outlier_indices = set()
        
        for col in numeric_columns:
            try:
                detection_result = self._detect_outliers_for_column(col, detection, threshold)
                
                if detection_result is None:
                    continue
                    
                outlier_indices = detection_result["outlier_indices"]
                
                if not outlier_indices:
                    continue
                    
                min_threshold, max_threshold = self._calculate_thresholds(
                    detection_result, detection, threshold
                )
                
                all_results.append({
                    "column": col,
                    "outlierCount": len(outlier_indices),
                    "minThreshold": min_threshold,
                    "maxThreshold": max_threshold,
                    "outlierIndices": outlier_indices,
                })
                
                all_outlier_indices.update(outlier_indices)
                total_outlier_count += len(outlier_indices)
                
            except Exception as e:
                # 특정 컬럼에서 오류가 발생해도 다른 컬럼들은 계속 처리
                continue
                
        if not all_results:
            raise CustomAPIException(
                status_code=400,
                error_code="OUTLIER_008",
                message="모든 숫자형 컬럼에서 이상치 탐지를 수행할 수 없습니다.",
            )
            
        return all_results, list(all_outlier_indices), total_outlier_count

    def handle_outliers_imputation(
        self, column=None, method="MEAN", detection="ZSCORE", threshold=3.0
    ):
        """
        이상치 처리 (대체)

        Parameters:
        -----------
        column : str, optional
            처리할 컬럼 이름. None인 경우 모든 숫자형 컬럼에 대해 처리
        method : str, default='MEAN'
            처리 방법 ('MEAN', 'MEDIAN', 'THRESHOLD')
        detection : str, default='ZSCORE'
            탐지 방법 ('IQR', 'ZSCORE')
        threshold : float, default=3.0
            Z-score 임계값 또는 IQR 승수

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 특정 컬럼이 지정된 경우
        if column is not None:
            detection_result = self._detect_outliers_for_column(column, detection, threshold)
            
            if detection_result is None:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_002",
                    message=f"'{column}' 컬럼에서 이상치 탐지에 실패했습니다.",
                )
            
            outlier_indices = detection_result["outlier_indices"]
            
            if not outlier_indices:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_003",
                    message=f"{column} 컬럼에서 이상치가 발견되지 않았습니다.",
                )
            
            # 원래 데이터의 복사본 저장
            original_rows = self.df.loc[outlier_indices].copy()
            outlier_count = len(outlier_indices)
            
            # 이상치 처리
            if method == "THRESHOLD":
                # 상한/하한값으로 제한
                if detection == "IQR":
                    lower_bound = detection_result.get("lowerBound")
                    upper_bound = detection_result.get("upperBound")
                    self.df.loc[self.df[column] < lower_bound, column] = lower_bound
                    self.df.loc[self.df[column] > upper_bound, column] = upper_bound
                    min_threshold = lower_bound
                    max_threshold = upper_bound
                else:  # ZSCORE
                    mean = detection_result["mean"]
                    std = detection_result["std"]
                    lower_bound = mean - threshold * std
                    upper_bound = mean + threshold * std
                    self.df.loc[self.df[column] < lower_bound, column] = lower_bound
                    self.df.loc[self.df[column] > upper_bound, column] = upper_bound
                    min_threshold = lower_bound
                    max_threshold = upper_bound
            
            elif method == "MEAN":
                # 평균값으로 대체
                mean_value = self.df[column].mean()
                self.df.loc[outlier_indices, column] = mean_value
                min_threshold, max_threshold = self._calculate_thresholds(
                    detection_result, detection, threshold
                )
            
            elif method == "MEDIAN":
                # 중앙값으로 대체
                median_value = self.df[column].median()
                self.df.loc[outlier_indices, column] = median_value
                min_threshold, max_threshold = self._calculate_thresholds(
                    detection_result, detection, threshold
                )
            
            else:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_004",
                    message="유효하지 않은 처리 방법입니다. 'THRESHOLD', 'MEAN', 'MEDIAN' 중 하나를 사용하세요.",
                )
            
            # 변경된 행
            imputed_rows = self.df.loc[outlier_indices].copy()
            
            # API 응답 형식에 맞게 결과 구성
            result = {
                "column": column,
                "method": method,
                "detection": detection,
                "outlierCount": outlier_count,
                "imputedCount": outlier_count,
                "minThreshold": float(min_threshold),
                "maxThreshold": float(max_threshold),
                "outlierIndices": outlier_indices,
                "originalRows": original_rows.to_dict("records"),
                "imputedRows": imputed_rows.to_dict("records"),
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": outlier_indices[0] if outlier_indices else 0,
            }
            
            return result
        
        # 전체 숫자형 컬럼에 대해 처리하는 로직
        else:
            all_results, all_outlier_indices, total_outlier_count = self._detect_outliers_for_all_columns(
                detection, threshold
            )
            
            # 정렬된 이상치 인덱스
            sorted_outlier_indices = sorted(all_outlier_indices)
            
            # 원본값과 대체값 저장을 위한 딕셔너리
            all_original_rows = {}
            all_imputed_rows = {}
            
            # 각 컬럼별로 이상치 처리
            for result in all_results:
                col = result["column"]
                outlier_indices = result["outlier_indices"]
                
                # 원래 값 저장
                original_values = self.df.loc[outlier_indices, col].copy()
                all_original_rows[col] = original_values
                
                # 이상치 처리
                if method == "THRESHOLD":
                    # 상한/하한값으로 제한
                    min_threshold = result["minThreshold"]
                    max_threshold = result["maxThreshold"]
                    self.df.loc[self.df[col] < min_threshold, col] = min_threshold
                    self.df.loc[self.df[col] > max_threshold, col] = max_threshold
                    
                elif method == "MEAN":
                    # 평균값으로 대체
                    mean_value = self.df[col].mean()
                    self.df.loc[outlier_indices, col] = mean_value
                    
                elif method == "MEDIAN":
                    # 중앙값으로 대체
                    median_value = self.df[col].median()
                    self.df.loc[outlier_indices, col] = median_value
                
                # 변경된 값 저장
                imputed_values = self.df.loc[outlier_indices, col].copy()
                all_imputed_rows[col] = imputed_values
            
            # 원본 행과 대체된 행 구성
            original_rows_records = {}
            imputed_rows_records = {}
            
            for idx in sorted_outlier_indices:
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
            
            # API 응답 형식에 맞게 결과 구성
            result = {
                "column": "all_numeric",  # 전체 숫자형 컬럼을 의미
                "method": method,
                "detection": detection,
                "outlierCount": total_outlier_count,
                "imputedCount": total_outlier_count,
                "outlierIndices": sorted_outlier_indices,
                "originalRows": original_rows_records,
                "imputedRows": imputed_rows_records,
                "details": all_results,  # 각 컬럼별 상세 결과
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": sorted_outlier_indices[0] if sorted_outlier_indices else 0,
            }
            
            return result

    def handle_outliers_remove(
        self, column=None, method="ROW_REMOVE", detection="ZSCORE", threshold=3.0
    ):
        """
        이상치 제거

        Parameters:
        -----------
        column : str, optional
            처리할 컬럼 이름. None인 경우 모든 숫자형 컬럼에 대해 처리
        method : str, default='ROW_REMOVE'
            제거 방법 ('ROW_REMOVE', 'COL_REMOVE')
        detection : str, default='ZSCORE'
            탐지 방법 ('IQR', 'ZSCORE')
        threshold : float, default=3.0
            Z-score 임계값 또는 IQR 승수

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 특정 컬럼이 지정된 경우
        if column is not None:
            detection_result = self._detect_outliers_for_column(column, detection, threshold)
            
            if detection_result is None:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_002",
                    message=f"'{column}' 컬럼에서 이상치 탐지에 실패했습니다.",
                )
            
            outlier_indices = detection_result["outlier_indices"]
            
            if not outlier_indices:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_003",
                    message=f"{column} 컬럼에서 이상치가 발견되지 않았습니다.",
                )
            
            outlier_count = len(outlier_indices)
            removed_rows = []
            removed_columns = []
            
            # 제거 방법에 따라 처리
            if method == "ROW_REMOVE":
                # 이상치가 있는 행 제거
                removed_rows = self.df.loc[outlier_indices].to_dict("records")
                self.df = self.df.drop(outlier_indices)
            
            elif method == "COL_REMOVE":
                # 이상치가 있는 열 제거
                removed_columns = [column]
                self.df = self.df.drop(columns=[column])
            
            else:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_006",
                    message=f"지원하지 않는 제거 방법입니다: {method}. 'ROW_REMOVE' 또는 'COL_REMOVE'를 사용하세요.",
                )
            
            # 임계값 계산
            min_threshold, max_threshold = self._calculate_thresholds(
                detection_result, detection, threshold
            )
            
            # API 응답 형식에 맞게 결과 구성
            result = {
                "method": method,
                "detection": detection,
                "outlierCount": outlier_count,
                "removedCount": outlier_count,
                "minThreshold": float(min_threshold),
                "maxThreshold": float(max_threshold),
                "outlierIndices": outlier_indices,
                "removedRows": removed_rows,
                "removedColumns": removed_columns,
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": outlier_indices[0] if outlier_indices else 0,
            }
            
            return result
        
        # 전체 숫자형 컬럼에 대해 처리하는 로직
        else:
            all_results, all_outlier_indices, total_outlier_count = self._detect_outliers_for_all_columns(
                detection, threshold
            )
            
            # 정렬된 이상치 인덱스
            sorted_outlier_indices = sorted(all_outlier_indices)
            removed_rows = []
            removed_columns = []
            
            # 제거 방법에 따라 처리
            if method == "ROW_REMOVE":
                # 이상치가 있는 행 제거
                if sorted_outlier_indices:
                    removed_rows = self.df.loc[sorted_outlier_indices].to_dict("records")
                    self.df = self.df.drop(sorted_outlier_indices)
            
            elif method == "COL_REMOVE":
                # 이상치가 있는 열 제거
                for result in all_results:
                    col = result["column"]
                    removed_columns.append(col)
                
                if removed_columns:
                    self.df = self.df.drop(columns=removed_columns)
            
            else:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_006",
                    message=f"지원하지 않는 제거 방법입니다: {method}. 'ROW_REMOVE' 또는 'COL_REMOVE'를 사용하세요.",
                )
            
            # API 응답 형식에 맞게 결과 구성
            result = {
                "column": "all_numeric",  # 전체 숫자형 컬럼을 의미
                "method": method,
                "detection": detection,
                "outlierCount": total_outlier_count,
                "removedCount": len(removed_rows) if method == "ROW_REMOVE" else len(removed_columns),
                "outlierIndices": sorted_outlier_indices,
                "removedRows": removed_rows,
                "removedColumns": removed_columns,
                "details": all_results,  # 각 컬럼별 상세 결과
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": sorted_outlier_indices[0] if sorted_outlier_indices else 0,
            }
            
            return result

    def handle_outliers_detection(self, column=None, detection="ZSCORE", threshold=3.0):
        """
        이상치 탐지 (변경 없이 탐지만 수행)

        Parameters:
        -----------
        column : str, optional
            탐지할 컬럼 이름. None인 경우 모든 숫자형 컬럼에 대해 탐지
        detection : str, default='ZSCORE'
            탐지 방법 ('IQR', 'ZSCORE')
        threshold : float, default=3.0
            Z-score 임계값 또는 IQR 승수

        Returns:
        --------
        dict
            탐지 결과 정보
        """
        # 특정 컬럼이 지정된 경우
        if column is not None:
            # 컬럼 존재 여부 확인
            if column not in self.df.columns:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_001",
                    message=f"컬럼 '{column}'이 데이터에 존재하지 않습니다.",
                )
                
            detection_result = self._detect_outliers_for_column(column, detection, threshold)
            
            if detection_result is None:
                raise CustomAPIException(
                    status_code=400,
                    error_code="OUTLIER_002",
                    message=f"'{column}' 컬럼에서 이상치 탐지에 실패했습니다.",
                )
            
            # 임계값 계산
            min_threshold, max_threshold = self._calculate_thresholds(
                detection_result, detection, threshold
            )
            
            # API 응답 형식에 맞게 결과 구성
            result = {
                "column": column,
                "detection": detection,
                "outlierCount": detection_result["outlier_count"],
                "minThreshold": float(min_threshold),
                "maxThreshold": float(max_threshold),
                "outlierIndices": detection_result["outlier_indices"],
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": detection_result["outlier_indices"][0] if len(detection_result["outlier_indices"])>0 else 0,
            }
            
            return result
        
        # 전체 숫자형 컬럼에 대해 탐지
        else:
            all_results, all_outlier_indices, total_outlier_count = self._detect_outliers_for_all_columns(
                detection, threshold
            )
            
            # 정렬된 이상치 인덱스
            sorted_outlier_indices = sorted(all_outlier_indices)
            
            # API 응답 형식에 맞게 결과 구성
            result = {
                "column": "all_numeric",  # 전체 숫자형 컬럼을 의미
                "detection": detection,
                "outlierCount": total_outlier_count,
                "minThreshold": None,  # 전체 분석에서는 단일 임계값이 없음
                "maxThreshold": None,
                "outlierIndices": sorted_outlier_indices,  # 중복 제거된 전체 이상치 인덱스
                "details": all_results,  # 각 컬럼별 상세 결과
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "startPoint": sorted_outlier_indices[0] if sorted_outlier_indices else 0,
            }
            
            return result
    
    def detect_outliers_iqr(self, column, multiplier=1.5):
        """
        IQR 방식으로 이상치 탐지

        Parameters:
        -----------
        column : str
            이상치를 탐지할 컬럼 이름
        multiplier : float, default=1.5
            IQR에 곱할 값 (일반적으로 1.5 사용)

        Returns:
        --------
        dict
            이상치 탐지 결과 정보
        """
        if column not in self.df.columns:
            return {"error": f"컬럼 '{column}'이 데이터에 존재하지 않습니다."}

        # 컬럼이 숫자형인지 확인
        if not pd.api.types.is_numeric_dtype(self.df[column]):
            return {
                "error": f"'{column}' 컬럼은 숫자형이 아니므로 이상치 탐지가 불가능합니다."
            }

        # 결측치가 있는 행은 제외
        valid_data = self.df[column].dropna()

        # IQR 계산
        Q1 = valid_data.quantile(0.25)
        Q3 = valid_data.quantile(0.75)
        IQR = Q3 - Q1

        # 이상치 경계값 계산
        lower_bound = Q1 - multiplier * IQR
        upper_bound = Q3 + multiplier * IQR

        # 이상치 인덱스 탐지
        outlier_indices = self.df[
            (self.df[column] < lower_bound) | (self.df[column] > upper_bound)
        ].index.tolist()

        return {
            "method": "IQR",
            "column": column,
            "multiplier": multiplier,
            "Q1": float(Q1),
            "Q3": float(Q3),
            "IQR": float(IQR),
            "lowerBound": float(lower_bound),
            "upperBound": float(upper_bound),
            "outlier_indices": outlier_indices,
            "outlier_count": len(outlier_indices),
            "outlier_ratio": len(outlier_indices) / len(valid_data) * 100,
            "outlier_values": (
                self.df.loc[outlier_indices, column].tolist() if outlier_indices else []
            ),
        }

    def detect_outliers_zscore(self, column, threshold=3.0):
        """
        Z-score 방식으로 이상치 탐지

        Parameters:
        -----------
        column : str
            이상치를 탐지할 컬럼 이름
        threshold : float, default=3.0
            Z-score 임계값 (일반적으로 3.0 사용)

        Returns:
        --------
        dict
            이상치 탐지 결과 정보
        """
        if column not in self.df.columns:
            return {"error": f"컬럼 '{column}'이 데이터에 존재하지 않습니다."}

        # 컬럼이 숫자형인지 확인
        if not pd.api.types.is_numeric_dtype(self.df[column]):
            return {
                "error": f"'{column}' 컬럼은 숫자형이 아니므로 이상치 탐지가 불가능합니다."
            }

        # 결측치가 있는 행은 제외
        valid_data = self.df[column].dropna()

        # Z-score 계산
        z_scores = stats.zscore(valid_data)

        # 이상치 인덱스 탐지 (원본 데이터프레임 인덱스와 매핑)
        valid_indices = valid_data.index
        outlier_mask = np.abs(z_scores) > threshold
        outlier_indices = valid_indices[outlier_mask].tolist()

        return {
            "method": "ZSCORE",
            "column": column,
            "threshold": threshold,
            "mean": float(valid_data.mean()),
            "std": float(valid_data.std()),
            "outlier_indices": outlier_indices,
            "outlier_count": len(outlier_indices),
            "outlier_ratio": len(outlier_indices) / len(valid_data) * 100,
            "outlier_values": (
                self.df.loc[outlier_indices, column].tolist() if outlier_indices else []
            ),
        }