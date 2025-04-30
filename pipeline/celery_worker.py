from celery import Celery
import pandas as pd
from sklearn.linear_model import LogisticRegression, ElasticNet
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor, \
    GradientBoostingRegressor
import pickle
import os
from config import (
    RABBITMQ_BROKER_URL,
    PROJECT_ROOT,
    get_absolute_path,
    get_model_path,
    DEFAULT_TARGET_COLUMN
)

# Celery 앱 설정 (RabbitMQ 브로커 사용)
app = Celery('ml_worker',
             broker=RABBITMQ_BROKER_URL,
             backend='rpc://')

# 지원하는 모델 맵핑
MODEL_REGISTRY = {
    # 분류 모델
    'LogisticRegression': LogisticRegression,
    'SVC': SVC,
    'KNeighborsClassifier': KNeighborsClassifier,
    'RandomForestClassifier': RandomForestClassifier,
    'GradientBoostingClassifier': GradientBoostingClassifier,
    # 회귀 모델
    'ElasticNet': ElasticNet,
    'SVR': SVR,
    'RandomForestRegressor': RandomForestRegressor,
    'GradientBoostingRegressor': GradientBoostingRegressor
}


@app.task
def train_model_task(data_path: str, model_type: str, model_params: dict, save_path=None, target_column=None):
    # 기본값 설정
    if target_column is None:
        target_column = DEFAULT_TARGET_COLUMN

    print(f"[Task] Start training model: {model_type} with data: {data_path}")

    try:
        # 경로 처리 로직 추가
        data_path = get_absolute_path(data_path)
        print(f"[Task] Resolved file path: {data_path}")

        # 파일 존재 여부 확인
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {data_path}")

        # 모델 타입 검증
        if model_type not in MODEL_REGISTRY:
            supported_models = ", ".join(MODEL_REGISTRY.keys())
            raise ValueError(f"지원하지 않는 모델 타입입니다: {model_type}. 지원하는 모델: {supported_models}")

        # 데이터 로딩
        df = pd.read_csv(data_path)

        print(f"[Task] 데이터 크기: {df.shape}")
        print(f"[Task] 컬럼 목록: {list(df.columns)}")

        # 타겟 컬럼이 데이터에 있는지 확인
        if target_column not in df.columns:
            raise ValueError(f"타겟 컬럼 '{target_column}'이 데이터에 존재하지 않습니다.")

        # 데이터 분할
        X = df.drop(target_column, axis=1)
        y = df[target_column]

        print(f"[Task] 입력 특성: {X.shape}, 타겟: {y.shape}")

        # 모델 인스턴스 생성 및 학습
        model_class = MODEL_REGISTRY[model_type]
        model = model_class(**model_params)
        model.fit(X, y)

        # 모델 저장 경로 처리
        if save_path is None:
            # 기본 저장 경로 생성 (모델 타입 포함)
            save_path = f"models/{model_type.lower()}_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.pkl"

        save_path = get_model_path(save_path)
        print(f"[Task] Resolved save path: {save_path}")

        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        with open(save_path, 'wb') as f:
            pickle.dump(model, f)

        print(f"[Task] Model training completed. Saved to {save_path}")
        return {
            "status": "success",
            "model_type": model_type,
            "model_path": save_path,
            "data_shape": df.shape,
            "features": list(X.columns),
            "target": target_column
        }

    except Exception as e:
        print(f"[Task] Error during model training: {e}")
        return {"status": "error", "error": str(e)}