import pandas as pd
import numpy as np
import io
from datetime import datetime
from imblearn.over_sampling import SMOTE, SMOTENC
from imblearn.under_sampling import RandomUnderSampler
from sklearn.preprocessing import LabelEncoder
from core.exception import CustomAPIException


class ClassBalancingHandler:
    def __init__(self, data_path=None, df=None, encoding="utf-8"):
        """
        클래스 불균형 처리 클래스 초기화

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
                error_code="BALANCE_001",
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
                error_code="BALANCE_002",
                message=f"타겟 컬럼 '{column}'이 데이터에 존재하지 않습니다."
            )
    
    def _check_missing_values(self, target_column):
        """
        타겟 컬럼의 결측치 확인
        
        Parameters:
        -----------
        target_column : str
            타겟 컬럼 이름
            
        Raises:
        -------
        CustomAPIException
            타겟 컬럼에 결측치가 있는 경우
        """
        if self.df[target_column].isnull().any():
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_003",
                message=f"타겟 컬럼 '{target_column}'에 결측치가 있어 처리가 불가능합니다."
            )
    
    def _validate_target_column(self, target_column, method):
        """
        타겟 컬럼의 유효성 검증
        
        Parameters:
        -----------
        target_column : str
            타겟 컬럼 이름
        method : str
            불균형 처리 방법 ('OVER', 'UNDER')
            
        Returns:
        --------
        dict
            타겟 컬럼의 분포 정보
            
        Raises:
        -------
        CustomAPIException
            타겟 컬럼이 클래스 불균형 처리에 적합하지 않은 경우
        """
        # 고유 클래스 확인
        unique_classes = self.df[target_column].unique()
        class_count = len(unique_classes)
        
        # 클래스 수 검증
        if class_count < 2:
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_007",
                message=f"타겟 컬럼 '{target_column}'의 클래스 수가 2개 미만입니다. 클래스 불균형 처리를 위해서는 최소 2개의 클래스가 필요합니다."
            )
        
        # SMOTE 적용 시 클래스 수 10개 이하 권장
        if method == 'OVER' and class_count > 10:
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_008",
                message=f"타겟 컬럼 '{target_column}'의 클래스 수({class_count})가 너무 많습니다. 오버샘플링은 클래스 수가 적을 때 효과적입니다. 클래스 수가 10개 이하인 컬럼을 사용하거나 클래스를 그룹화하세요."
            )
        
        # 클래스 분포 확인
        class_distribution = dict(self.df[target_column].value_counts())
        
        # 소수 클래스의 샘플 수 확인 (SMOTE 요구사항)
        min_samples = min(class_distribution.values())
        
        if method == 'OVER':
            if min_samples < 2:
                raise CustomAPIException(
                    status_code=400,
                    error_code="BALANCE_009",
                    message="소수 클래스의 샘플 수가 2개 미만입니다. SMOTE는 최소 2개 이상의 샘플이 필요합니다."
                )
            elif min_samples < 6:
                # 경고만 제공하고 계속 진행 (k는 자동 조정될 수 있음)
                print(f"경고: 소수 클래스의 샘플 수({min_samples})가 적습니다. SMOTE의 효과가 제한될 수 있습니다.")
        
        # 클래스 불균형 정도 확인 (불균형이 심하지 않은 경우 경고)
        max_samples = max(class_distribution.values())
        imbalance_ratio = max_samples / min_samples
        
        if imbalance_ratio < 1.5:
            # 심각하지 않은 경우 경고만
            print(f"경고: 타겟 컬럼 '{target_column}'의 클래스 불균형이 심하지 않습니다. 불균형 비율: {imbalance_ratio:.2f}")
        
        return class_distribution
    
    def _validate_sampling_method(self, method):
        """
        샘플링 방법 유효성 검증
        
        Parameters:
        -----------
        method : str
            불균형 처리 방법
            
        Raises:
        -------
        CustomAPIException
            지원하지 않는 방법인 경우
        """
        if method not in ['OVER', 'UNDER']:
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_006",
                message=f"지원하지 않는 방법입니다: {method}. 'OVER' 또는 'UNDER'를 사용하세요."
            )

    def balance_class(self, target_column, sampling_ratio=200, method='OVER'):
        """
        클래스 불균형 처리

        Parameters:
        -----------
        target_column : str
            타겟 컬럼 이름
        sampling_ratio : int, default=200
            샘플링 비율 (%)
        method : str, default='OVER'
            불균형 처리 방법 ('OVER', 'UNDER')

        Returns:
        --------
        dict
            처리 결과 정보
        """
        # 컬럼 존재 여부 확인
        self._check_column_exists(target_column)
        
        # 결측치 확인
        self._check_missing_values(target_column)
        
        # 샘플링 방법 검증
        self._validate_sampling_method(method)
        
        # 타겟 컬럼 유효성 검증
        original_distribution = self._validate_target_column(target_column, method)
        
        # 타겟 컬럼 분리
        X = self.df.drop(columns=[target_column])
        y = self.df[target_column]
        
        # 숫자형이 아닌 컬럼 처리
        non_numeric_columns = X.select_dtypes(exclude=[np.number]).columns
        label_encoders = {}
        
        try:
            if len(non_numeric_columns) > 0:
                # 레이블 인코딩 적용
                for col in non_numeric_columns:
                    if X[col].isnull().any():
                        raise CustomAPIException(
                            status_code=400,
                            error_code="BALANCE_010",
                            message=f"피처 컬럼 '{col}'에 결측치가 있어 인코딩이 불가능합니다. 먼저 결측치를 처리해주세요."
                        )
                        
                    le = LabelEncoder()
                    X[col] = le.fit_transform(X[col])
                    label_encoders[col] = le
        except Exception as e:
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_011",
                message=f"범주형 피처 인코딩 실패: {str(e)}"
            )

        # 샘플링 처리
        try:
            if method == 'OVER':
                # SMOTE 오버샘플링
                minority_class = min(original_distribution.items(), key=lambda x: x[1])[0]
                majority_class = max(original_distribution.items(), key=lambda x: x[1])[0]
                
                # 샘플링 전략: 모든 소수 클래스를 동일한 비율로 증가
                sampling_strategy = {}
                for class_label, count in original_distribution.items():
                    if class_label == minority_class:
                        # 소수 클래스는 기준이 됨
                        sampling_strategy[class_label] = count
                    else:
                        # 다른 클래스들은 소수 클래스 대비 같은 비율로 설정
                        sampling_strategy[class_label] = int(
                            min(count, original_distribution[minority_class] * (sampling_ratio / 100))
                        )
                
                # SMOTE 적용 (다중 클래스인 경우 다변량 버전 사용)
                if len(original_distribution) > 2:
                    smote = SMOTENC(categorical_features=list(range(len(non_numeric_columns))), 
                                    sampling_strategy=sampling_strategy, 
                                    random_state=42)
                else:
                    smote = SMOTE(sampling_strategy=sampling_strategy, random_state=42)
                
                X_resampled, y_resampled = smote.fit_resample(X, y)
                
            elif method == 'UNDER':
                # 언더샘플링
                minority_class = min(original_distribution.items(), key=lambda x: x[1])[0]
                majority_class = max(original_distribution.items(), key=lambda x: x[1])[0]
                
                # 다수 클래스를 소수 클래스 크기의 비율로 축소
                sampling_strategy = {}
                for class_label, count in original_distribution.items():
                    if class_label == majority_class:
                        # 다수 클래스는 축소 대상
                        sampling_strategy[class_label] = int(count * (sampling_ratio / 100))
                    else:
                        # 다른 클래스들은 그대로 유지
                        sampling_strategy[class_label] = count
                
                rus = RandomUnderSampler(sampling_strategy=sampling_strategy, random_state=42)
                X_resampled, y_resampled = rus.fit_resample(X, y)
                
        except ValueError as e:
            if "Expected n_neighbors <= n_samples" in str(e):
                raise CustomAPIException(
                    status_code=400,
                    error_code="BALANCE_012",
                    message="소수 클래스의 샘플 수가 너무 적어 SMOTE를 적용할 수 없습니다. 더 많은 데이터를 수집하거나 다른 오버샘플링 방법을 사용하세요."
                )
            else:
                raise CustomAPIException(
                    status_code=400,
                    error_code="BALANCE_013",
                    message=f"샘플링 실패: {str(e)}"
                )
        except Exception as e:
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_014",
                message=f"예상치 못한 오류가 발생했습니다: {str(e)}"
            )

        # 새로운 분포 확인
        new_distribution = dict(pd.Series(y_resampled).value_counts())

        # 샘플 변화량 계산
        total_original = sum(original_distribution.values())
        total_new = sum(new_distribution.values())
        sample_variation = total_new - total_original

        # 리샘플링된 데이터프레임 생성
        df_resampled = pd.concat([X_resampled, pd.Series(y_resampled, name=target_column)], axis=1)

        # 레이블 인코딩된 컬럼을 원래대로 디코딩
        try:
            if len(non_numeric_columns) > 0 and label_encoders:
                for col, le in label_encoders.items():
                    df_resampled[col] = le.inverse_transform(df_resampled[col].astype(int))
        except Exception as e:
            # 디코딩 실패해도 처리는 계속 진행
            print(f"경고: 일부 컬럼 디코딩에 실패했습니다: {str(e)}")

        self.df = df_resampled

        # 결과 구성
        return {
            "balanceType": method,
            "targetColumn": target_column,
            "originalDistribution": {str(k): v for k, v in original_distribution.items()},
            "newDistribution": {str(k): v for k, v in new_distribution.items()},
            "samplingRatio": sampling_ratio,
            "sampleVariation": sample_variation,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        }