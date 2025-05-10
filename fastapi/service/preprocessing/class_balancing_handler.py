import pandas as pd
import numpy as np
import io
from datetime import datetime
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from sklearn.preprocessing import LabelEncoder
from core.exception import CustomAPIException


class ClassBalancingHandler:
    def __init__(self, data_path=None, df=None):
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
                self.df = pd.read_csv(data_path)
            else:
                self.df = pd.read_csv(data_path)
        else:
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_001",
                message="데이터 파일 경로 또는 데이터프레임을 제공해야 합니다."
            )
        # 원본 데이터 백업
        self.original_df = self.df.copy()

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
        if target_column not in self.df.columns:
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_002",
                message=f"타겟 컬럼 '{target_column}'이 데이터에 존재하지 않습니다."
            )

        # 타겟 컬럼 분리
        X = self.df.drop(columns=[target_column])
        y = self.df[target_column]

        # 결측치 확인
        if X.isnull().any().any():
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_003",
                message="특성 데이터에 결측치가 있어 처리가 불가능합니다."
            )

        if y.isnull().any():
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_003",
                message=f"타겟 컬럼 '{target_column}'에 결측치가 있어 처리가 불가능합니다."
            )

        # 원본 분포 확인
        original_distribution = dict(y.value_counts())

        # 숫자형이 아닌 컬럼 처리
        non_numeric_columns = X.select_dtypes(exclude=[np.number]).columns
        if len(non_numeric_columns) > 0:
            # 레이블 인코딩 적용
            label_encoders = {}
            for col in non_numeric_columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col])
                label_encoders[col] = le

        # 샘플링 처리
        if method == 'OVER':
            # SMOTE 오버샘플링
            # 샘플링 비율 계산 (소수 클래스 기준)
            minority_class_count = min(original_distribution.values())
            desired_count = int(minority_class_count * (sampling_ratio / 100))

            # SMOTE 적용
            try:
                smote = SMOTE(sampling_strategy='minority', random_state=42)
                X_resampled, y_resampled = smote.fit_resample(X, y)
            except ValueError as e:
                raise CustomAPIException(
                    status_code=400,
                    error_code="BALANCE_004",
                    message=f"SMOTE 오버샘플링 실패: {str(e)}"
                )

        elif method == 'UNDER':
            # 언더샘플링
            # 다수 클래스를 소수 클래스 크기의 비율로 축소
            minority_class_count = min(original_distribution.values())
            majority_class = max(original_distribution.items(), key=lambda x: x[1])[0]
            majority_count = original_distribution[majority_class]

            desired_count = int(majority_count * (sampling_ratio / 100))
            sampling_strategy = {
                class_label: min(count, desired_count) if class_label == majority_class else count
                for class_label, count in original_distribution.items()
            }

            try:
                rus = RandomUnderSampler(sampling_strategy=sampling_strategy, random_state=42)
                X_resampled, y_resampled = rus.fit_resample(X, y)
            except ValueError as e:
                raise CustomAPIException(
                    status_code=400,
                    error_code="BALANCE_005",
                    message=f"언더샘플링 실패: {str(e)}"
                )

        else:
            raise CustomAPIException(
                status_code=400,
                error_code="BALANCE_006",
                message=f"지원하지 않는 방법입니다: {method}. 'OVER' 또는 'UNDER'를 사용하세요."
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
        if len(non_numeric_columns) > 0 and 'label_encoders' in locals():
            for col, le in label_encoders.items():
                df_resampled[col] = le.inverse_transform(df_resampled[col].astype(int))

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