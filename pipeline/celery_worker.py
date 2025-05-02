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
    DEFAULT_TARGET_COLUMN,
    MINIO_DATASETS_BUCKET,
    MINIO_MODELS_BUCKET,
)
from minio_utils import upload_model, download_dataset, ensure_bucket_exists, get_file_url, parse_s3_url

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
def train_model_task(data_path: str, model_type: str, model_params: dict, save_path=None, target_column=None, pipeline_id=None
):
    # 기본값 설정
    if target_column is None:
        target_column = DEFAULT_TARGET_COLUMN

    print(f"[Task] Start training model: {model_type} with data: {data_path}")
    if pipeline_id:
        print(f"[Task] Pipeline ID: {pipeline_id}")

    try:
        # S3 URL 처리 - 문자열에 s3:// 가 포함되어 있으면 S3 URL로 처리
        if 's3://' in data_path:
            # 경로에서 s3:// 부분만 추출
            s3_url = data_path
            if not s3_url.startswith('s3://'):
                # 전체 경로에서 s3:// 부분부터 끝까지 추출
                s3_url = 's3://' + data_path.split('s3://')[1]

            print(f"[Task] Detected S3 URL: {s3_url}")

            try:
                bucket_name, object_name = parse_s3_url(s3_url)
                print(f"[Task] Downloading from S3 - Bucket: {bucket_name}, Object: {object_name}")

                # 임시 경로에 파일 다운로드
                if os.name == 'nt':  # Windows
                    tmp_dir = os.environ.get('TEMP') or os.environ.get('TMP') or 'C:/temp'
                    os.makedirs(tmp_dir, exist_ok=True)
                    local_data_path = os.path.join(tmp_dir, os.path.basename(object_name))
                else:  # Linux/Unix
                    os.makedirs('/tmp', exist_ok=True)
                    local_data_path = os.path.join('/tmp', os.path.basename(object_name))

                # 임시 파일 경로의 디렉토리 생성
                os.makedirs(os.path.dirname(local_data_path), exist_ok=True)

                # MinIO에서 파일 다운로드
                data_path = download_dataset(object_name, local_data_path, bucket_name)
                if data_path is None:
                    raise FileNotFoundError(f"S3에서 파일을 다운로드할 수 없습니다: {object_name}")

                print(f"[Task] Successfully downloaded to: {data_path}")
            except Exception as download_error:
                print(f"[Task] Error downloading from S3: {download_error}")
                raise
        else:
            # 로컬 파일 경로 처리
            if not os.path.isabs(data_path):
                data_path = os.path.join(PROJECT_ROOT, data_path)
            print(f"[Task] Using local file path: {data_path}")

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

        # 모델 직렬화
        model_bytes = pickle.dumps(model)

        # 모델 저장 경로 처리
        if save_path is None:
            # 기본 저장 경로 생성 (모델 타입 포함)
            save_filename = f"{model_type.lower()}_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.pkl"
            save_path = f"models/{save_filename}"

        # MinIO에 모델 저장
        from minio_utils import upload_model, ensure_bucket_exists
        from config import MINIO_MODELS_BUCKET

        ensure_bucket_exists(MINIO_MODELS_BUCKET)
        s3_model_path = upload_model(
            model_bytes,
            os.path.basename(save_path),
            MINIO_MODELS_BUCKET
        )

        print(f"[Task] Model training completed. Saved to {s3_model_path}")
        result = {
            "status": "success",
            "model_type": model_type,
            "s3_model_path": s3_model_path,
            "data_path": data_path,
            "data_shape": df.shape,
            "features": list(X.columns),
            "target": target_column
        }

        if pipeline_id:
            result["pipeline_id"] = pipeline_id

        return result

    except Exception as e:
        error_result = {"status": "error", "error": str(e)}

        if pipeline_id:
            error_result["pipeline_id"] = pipeline_id

        print(f"[Task] Error during model training: {e}")
        return error_result
