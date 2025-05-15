from celery import Celery
from confluent_kafka import Producer
import json
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
    KAFKA_PRODUCER_CONFIG,
    KAFKA_STATUS_TOPIC
)
from minio_utils import upload_model, download_dataset, parse_s3_url
from mongo_utils import save_to_mongodb, update_model_by_pipeline_id
from mlflow_utils import log_model_to_mlflow
from kserve_utils import (
    sanitize_k8s_name,
    deploy_model_with_virtual_service
)
from kong_utils import (
    setup_model_api_gateway,
    save_api_info_by_pipeline_id
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
def train_model_task(data_path: str, model_type: str, model_params: dict, save_path=None, target_column=None,
                     pipeline_id=None, project_id=None, member_id=None):
    # 기본값 설정
    if target_column is None:
        target_column = DEFAULT_TARGET_COLUMN

    # 학습 시작 시간 기록
    start_time = pd.Timestamp.now()
    start_time_iso = start_time.isoformat()

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
        # 인덱스 초기화 추가
        df = df.reset_index(drop=True)

        print(f"[Task] 데이터 크기: {df.shape}")
        print(f"[Task] 컬럼 목록: {list(df.columns)}")

        # 타겟 컬럼이 데이터에 있는지 확인
        if target_column not in df.columns:
            raise ValueError(f"타겟 컬럼 '{target_column}'이 데이터에 존재하지 않습니다.")

        # 데이터 분할
        X = df.drop(target_column, axis=1)
        y = df[target_column]

        # train_test_split 호출 전에 반드시 pandas 데이터프레임으로 변환하고, 인덱스를 재설정
        X = pd.DataFrame(X).reset_index(drop=True)
        y = pd.Series(y).reset_index(drop=True)

        # 인덱스 일관성 확인
        if not X.index.equals(y.index):
            print("[Task] 경고: X와 y의 인덱스가 일치하지 않아 재설정합니다.")
            X = X.reset_index(drop=True)
            y = y.reset_index(drop=True)

        print(f"[Task] 입력 특성: {X.shape}, 타겟: {y.shape}")

        # 특성 정보 수집
        features_info = []
        for col in X.columns:
            feature_info = {"name": col}
            # 데이터 타입 결정
            if pd.api.types.is_numeric_dtype(X[col]):
                feature_info["type"] = "number"
            elif isinstance(X[col].dtype, pd.CategoricalDtype) or X[col].nunique() / len(X[col]) < 0.1:
                feature_info["type"] = "category"
                # 범주형 변수의 클래스 추출 (최대 20개까지만)
                classes = X[col].value_counts().head(20).index.tolist()
                feature_info["class"] = [str(c) for c in classes]
            else:
                feature_info["type"] = "text"

            features_info.append(feature_info)

        # 모델 학습
        from sklearn.model_selection import train_test_split
        from sklearn import metrics
        import numpy as np
        import time

        # 학습/테스트 데이터 분할
        # 분할 후에도 인덱스 재설정
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train = pd.DataFrame(X_train).reset_index(drop=True)
        X_test = pd.DataFrame(X_test).reset_index(drop=True)
        y_train = pd.Series(y_train).reset_index(drop=True)
        y_test = pd.Series(y_test).reset_index(drop=True)

        # 모델 인스턴스 생성
        model_class = MODEL_REGISTRY[model_type]
        model = model_class(**model_params)

        # 모델 학습 (시간 측정)
        train_start_time = time.time()
        model.fit(X_train, y_train)
        train_end_time = time.time()

        learning_duration = int(train_end_time - train_start_time)

        # 모델 예측
        y_pred = model.predict(X_test)

        # 모델 타입 확인 (분류 모델인지 회귀 모델인지)
        is_classifier = model_type in ['LogisticRegression', 'SVC', 'KNeighborsClassifier',
                                       'RandomForestClassifier', 'GradientBoostingClassifier']

        # 성능 평가
        performance = {}
        feature_importance = {}

        # 1. 분류 모델 성능 평가
        if is_classifier:
            # 모델 유형 설정
            model_category = "CLASSIFICATION"
            algorithm_map = {
                'LogisticRegression': 'LogisticRegression',
                'SVC': 'SVC',
                'KNeighborsClassifier': 'KNeighborsClassifier',
                'RandomForestClassifier': 'RandomForestClassifier',
                'GradientBoostingClassifier': 'GradientBoostingClassifier'
            }
            algorithm = algorithm_map.get(model_type, model_type.upper())

            # 기본 성능 지표
            accuracy = metrics.accuracy_score(y_test, y_pred)

            # 다중 클래스 vs 이진 분류 처리
            if len(np.unique(y)) > 2:  # 다중 클래스
                precision = metrics.precision_score(y_test, y_pred, average='weighted')
                recall = metrics.recall_score(y_test, y_pred, average='weighted')
                f1 = metrics.f1_score(y_test, y_pred, average='weighted')

                # 혼동 행렬
                cm = metrics.confusion_matrix(y_test, y_pred).tolist()

                # 다중 클래스에서는 ROC/AUC가 복잡하므로 생략
                classification_metrics = {
                    "accuracy": float(accuracy),
                    "precision": float(precision),
                    "recall": float(recall),
                    "f1_score": float(f1),
                    "confusion_matrix": cm
                }
            else:  # 이진 분류
                precision = metrics.precision_score(y_test, y_pred)
                recall = metrics.recall_score(y_test, y_pred)
                f1 = metrics.f1_score(y_test, y_pred)

                # 혼동 행렬
                cm = metrics.confusion_matrix(y_test, y_pred).tolist()

                # ROC 곡선 데이터 생성
                try:
                    y_prob = model.predict_proba(X_test)[:, 1]
                    fpr, tpr, _ = metrics.roc_curve(y_test, y_prob)
                    auc = metrics.roc_auc_score(y_test, y_prob)

                    # 포인트 수가 너무 많으면 간소화 (최대 100개 포인트)
                    if len(fpr) > 100:
                        indices = np.linspace(0, len(fpr) - 1, 100, dtype=int)
                        fpr = fpr[indices].tolist()
                        tpr = tpr[indices].tolist()
                    else:
                        fpr = fpr.tolist()
                        tpr = tpr.tolist()

                    # ROC 곡선 데이터
                    roc_curve_data = {
                        "fpr": fpr,
                        "tpr": tpr
                    }

                    classification_metrics = {
                        "accuracy": float(accuracy),
                        "precision": float(precision),
                        "recall": float(recall),
                        "f1_score": float(f1),
                        "auc": float(auc),
                        "confusion_matrix": cm,
                        "roc_curve": roc_curve_data
                    }
                except (AttributeError, IndexError):
                    # predict_proba를 지원하지 않는 모델 처리
                    classification_metrics = {
                        "accuracy": float(accuracy),
                        "precision": float(precision),
                        "recall": float(recall),
                        "f1_score": float(f1),
                        "confusion_matrix": cm
                    }

            performance["classification"] = classification_metrics

        # 2. 회귀 모델 성능 평가
        else:
            # 모델 유형 설정
            model_category = "REGRESSION"
            algorithm_map = {
                'ElasticNet': 'ElasticNet',
                'SVR': 'SVR',
                'RandomForestRegressor': 'RandomForestRegressor',
                'GradientBoostingRegressor': 'GradientBoostingRegressor'
            }
            algorithm = algorithm_map.get(model_type, model_type.upper())

            # 회귀 성능 지표
            r2 = metrics.r2_score(y_test, y_pred)
            mae = metrics.mean_absolute_error(y_test, y_pred)
            mse = metrics.mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)

            # 잔차 계산
            residuals = y_test - y_pred

            # 잔차 플롯 및 산점도 데이터 생성 (최대 200개 포인트)
            if len(y_test) > 200:
                # 랜덤 샘플링
                indices = np.random.choice(range(len(y_test)), 200, replace=False)
                plot_y_test = y_test.iloc[indices].values.tolist() if hasattr(y_test, 'iloc') else y_test[
                    indices].tolist()
                plot_y_pred = y_pred[indices].tolist()
                plot_residuals = residuals[indices].tolist()
            else:
                plot_y_test = y_test.tolist() if hasattr(y_test, 'tolist') else y_test.tolist()
                plot_y_pred = y_pred.tolist()
                plot_residuals = residuals.tolist()

            # 회귀 성능 지표
            regression_metrics = {
                "r_squared": float(r2),
                "mae": float(mae),
                "mse": float(mse),
                "rmse": float(rmse),
                "residual_plot": {
                    "predicted": plot_y_pred,
                    "residuals": plot_residuals
                },
                "scatter_plot": {
                    "actual": plot_y_test,
                    "predicted": plot_y_pred
                }
            }

            performance["regression"] = regression_metrics

        # 3. 특성 중요도 추출
        try:
            # 특성 중요도를 지원하는 모델 확인
            if hasattr(model, 'feature_importances_'):
                # RandomForest, GradientBoosting 등
                importances = model.feature_importances_
                for feat, imp in zip(X.columns, importances):
                    feature_importance[str(feat)] = float(imp)  # 키를 문자열로 변환
            elif hasattr(model, 'coef_'):
                # 선형 모델 (LogisticRegression, ElasticNet 등)
                coefs = model.coef_
                if coefs.ndim > 1:  # 다중 클래스일 경우
                    coefs = np.abs(coefs).mean(axis=0)  # 평균 절대값 사용

                for feat, coef in zip(X.columns, coefs):
                    # 계수 정규화 및 키를 문자열로 변환
                    feature_importance[str(feat)] = float(abs(coef))

                # 정규화
                if feature_importance:
                    max_imp = max(feature_importance.values())
                    for feat in list(feature_importance.keys()):  # 키 목록을 먼저 생성
                        feature_importance[feat] /= max_imp
            else:
                # 특성 중요도를 지원하지 않는 모델은 빈 객체 반환
                feature_importance = {}
        except Exception as e:
            print(f"[Task] Feature importance extraction error: {e}")
            feature_importance = {}

        # 학습 종료 시간 기록
        end_time = pd.Timestamp.now()
        end_time_iso = end_time.isoformat()

        # 모델 직렬화
        model_bytes = pickle.dumps(model)

        # 모델 저장 경로 처리
        timestamp = pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')
        save_filename = f"{pipeline_id}.pkl"

        # pipeline_id가 있으면 해당 폴더 내에 저장
        if pipeline_id:
            s3_object_name = f"project{project_id}/{save_filename}"
        else:
            s3_object_name = save_filename

        # MinIO에 모델 저장
        #ensure_bucket_exists(MINIO_MODELS_BUCKET)
        s3_model_path = upload_model(
            model_bytes,
            s3_object_name,
            MINIO_MODELS_BUCKET
        )

        # 업데이트할 모델 메타데이터 구성 - 지정된 필드만 포함
        model_metadata = {
            "pipeline_id": pipeline_id,
            "algorithm": algorithm,
            "train_info": {
                "start_time": start_time_iso,
                "end_time": end_time_iso,
                "epochs": 1,
                "features": features_info,
                "target_feature": target_column,
            },
            "performance": performance,
            "feature_importance": feature_importance,
            "learning_duration": float(train_end_time - train_start_time),  # 정수 대신 실수로 저장
            "model_file_path": s3_model_path,
            "registered_at": end_time_iso
        }

        print(f"[Task] Model training completed. Saved to {s3_model_path}")

        # MongoDB에 저장 또는 업데이트
        if pipeline_id:
            # pipeline_id가 있으면 업데이트
            print(f"[Task] 파이프라인 ID {pipeline_id}에 대한 모델 업데이트 시도")
            model_id = update_model_by_pipeline_id(pipeline_id, model_metadata)
            if model_id:
                print(f"[Task] 모델 업데이트/삽입 성공, ID: {model_id}")
            else:
                print("[Task] 모델 업데이트/삽입 실패")
        else:
            # pipeline_id가 없으면 새로 삽입
            print("[Task] 파이프라인 ID가 없어 새 모델로 저장")
            from mongo_utils import save_to_mongodb
            save_to_mongodb(model_metadata)

        # MLflow에 모델 로깅
        mlflow_info = log_model_to_mlflow(
            model=model,
            model_type=model_type,
            model_params=model_params,
            metrics=performance,
            feature_importance=feature_importance,
            pipeline_id=pipeline_id,
            project_id=project_id,
            features_info=features_info,
            target_column=target_column
        )

        # KServe InferenceService 배포
        if mlflow_info:
            # 모델 이름 생성 (MLflow 등록 이름 사용)
            model_name = mlflow_info["registered_model"]
            model_version = mlflow_info["registered_model_version"]

            full_model_name = f"{model_name}-{model_version}"

            # 모델 경로 설정 (MinIO 버킷 내부) -> MinIO 저장 경로와 동일
            model_path = s3_object_name

            # 현재 배포된 모델 수 확인하여 리소스 할당 결정
            import subprocess
            import yaml

            # 현재 사용 중인 CPU 리소스 확인
            try:
                cpu_cmd = "kubectl get inferenceservices -n default -o json | jq '.items[].spec.predictor.sklearn.resources.requests.cpu' | jq -s 'add'"
                cpu_result = subprocess.run(cpu_cmd, shell=True, check=True, stdout=subprocess.PIPE,
                                            stderr=subprocess.PIPE)
                current_cpu_usage = float(cpu_result.stdout.decode().strip() or "0")
                # CPU 사용량을 코어 단위로 변환 (예: 300m -> 0.3)
                if current_cpu_usage > 0:
                    current_cpu_usage = current_cpu_usage / 1000 if current_cpu_usage > 10 else current_cpu_usage
            except Exception as e:
                current_cpu_usage = 0.0
                print(f"Warning: Could not check CPU usage: {e}")

            # 사용 가능한 CPU 리소스 계산 (총 4 코어 중 90%만 할당하여 시스템 여유 확보)
            total_available_cpu = 3.6  # 4 코어의 90%
            available_cpu = max(0.0, total_available_cpu - current_cpu_usage)

            # 메모리 사용량 확인
            try:
                mem_cmd = "kubectl get inferenceservices -n default -o json | jq '.items[].spec.predictor.sklearn.resources.requests.memory' | grep -o '[0-9]*' | jq -s 'add'"
                mem_result = subprocess.run(mem_cmd, shell=True, check=True, stdout=subprocess.PIPE,
                                            stderr=subprocess.PIPE)
                current_mem_usage = float(mem_result.stdout.decode().strip() or "0")
            except Exception as e:
                current_mem_usage = 0.0
                print(f"Warning: Could not check memory usage: {e}")

            # 총 16GB 메모리 중 90%만 할당 (Mi 단위로 계산)
            total_available_mem = 14745  # 약 14.4GB (16GB의 90%)
            available_mem = max(0.0, total_available_mem - current_mem_usage)

            # 리소스 할당 결정 - 최대 30개 모델 고려
            # 각 모델당 평균 0.12 vCPU (120m) 기준
            model_cpu_request = "120m"  # 0.12 코어
            model_cpu_limit = "200m"  # 0.2 코어 (버스트 허용)

            # 각 모델당 메모리 - 약 480MB (500Mi)
            model_memory_request = "400Mi"
            model_memory_limit = "500Mi"

            # 인스턴스 부하 분산을 위한 리소스 요청 체크
            # 리소스가 부족할 경우 최소 요청으로 조정
            deployed_services_cmd = "kubectl get inferenceservices -n default | wc -l"
            deployed_count = int(subprocess.run(deployed_services_cmd, shell=True, check=True,
                                                stdout=subprocess.PIPE).stdout.decode().strip()) - 1  # 헤더 행 제외

            if deployed_count >= 25:  # 많은 모델이 이미 배포된 경우
                model_cpu_request = "100m"
                model_cpu_limit = "150m"
                model_memory_request = "300Mi"
                model_memory_limit = "400Mi"

            # InferenceService와 VirtualService 모두 배포
            deployment_success, deployment_message, service_name, service_url = deploy_model_with_virtual_service(
                model_name=pipeline_id,
                model_path=model_path,
                namespace="default",
                gpu_fraction=0.0,  # GPU 사용 안함
                cpu_request=model_cpu_request,
                cpu_limit=model_cpu_limit,
                memory_request=model_memory_request,
                memory_limit=model_memory_limit
            )

            # KServe 배포 성공 후 Kong API Gateway 설정
            if deployment_success and service_url:
                # Kong API Gateway 설정
                try:
                    print(f"[Task] Kong API Gateway 설정 시작 (모델: {pipeline_id})")

                    # 서비스 URL 구성
                    api_service_url = service_url
                    if not api_service_url.startswith('http'):
                        api_service_url = f"http://{api_service_url}"

                    # Kong API Gateway 설정 실행 (모델별 1:1 소비자 및 ACL 그룹 생성)
                    kong_result = setup_model_api_gateway(
                        pipeline_id=pipeline_id,
                        service_url=api_service_url,
                        paths=[f"/model/{pipeline_id}"]
                    )

                    if kong_result and kong_result["status"] == "success":
                        print(f"[Task] Kong API Gateway 설정 완료")

                        # MongoDB에 API 정보 저장
                        if pipeline_id:
                            api_info = {
                                "api_key": kong_result.get("api_key"),
                                "api_endpoint": kong_result.get("api_endpoint"),
                                "consumer": kong_result.get("consumer")
                            }
                            save_result = save_api_info_by_pipeline_id(pipeline_id, api_info)
                            if save_result:
                                print(f"[Task] API 정보를 MongoDB에 저장 완료")
                            else:
                                print(f"[Task] API 정보 MongoDB 저장 실패")

                            # API 엔드포인트를 모델 메타데이터에 추가
                            model_metadata["api_endpoint"] = kong_result.get("api_endpoint")

                    else:
                        print(f"[Task] Kong API Gateway 설정 실패: {kong_result.get('message', '알 수 없는 오류')}")
                except Exception as kong_error:
                    print(f"[Task] Kong API Gateway 설정 중 오류 발생: {kong_error}")

        # 결과 생성
        result = {
            "status": "success",
            "model_type": model_type,
            "s3_model_path": s3_model_path,
            "model_metadata": model_metadata
        }

        if pipeline_id:
            result["pipeline_id"] = pipeline_id

        # Kafka로 학습 완료 메시지 발행
        try:
            # 생산자 생성
            producer = Producer(KAFKA_PRODUCER_CONFIG)

            # 메시지 페이로드
            message = {
                "event_type": "model_training_completed",
                "timestamp": pd.Timestamp.now().isoformat(),
                "pipeline_id": pipeline_id,
                "project_id": project_id,
                "member_id": member_id,
                "model_type": model_type,
                "model_path": s3_model_path,
                "error_message": None,
                "status": "success"
            }

            # 토픽 지정 (config에서 가져올 수도 있음)
            topic = KAFKA_STATUS_TOPIC

            # 메시지 발행
            producer.produce(
                topic,
                key=str(pipeline_id) if pipeline_id else "unknown",
                value=json.dumps(message).encode('utf-8'),
                callback=lambda err, msg: print(
                    f"[Producer] 메시지 전송 완료: {msg.topic()}" if err is None else f"[Producer] 메시지 전송 실패: {err}")
            )

            # 모든 메시지가 발행될 때까지 대기
            producer.flush()

            print(f"[Task] 학습 완료 메시지가 Kafka에 성공적으로 발행됨: {topic}")

        except Exception as kafka_error:
            print(f"[Task] Kafka 메시지 발행 중 오류 발생: {kafka_error}")

        return result

    except Exception as e:
        error_result = {"status": "error", "error": str(e)}

        if pipeline_id:
            error_result["pipeline_id"] = pipeline_id

        # Kafka로 학습 실패 메시지 발행
        try:
            # 생산자 생성
            producer = Producer(KAFKA_PRODUCER_CONFIG)

            # 메시지 페이로드
            message = {
                "event_type": "model_training_failed",
                "timestamp": pd.Timestamp.now().isoformat(),
                "pipeline_id": pipeline_id,
                "project_id": project_id,
                "member_id": member_id,
                "model_type": model_type,
                "model_path": None,
                "error_message": str(e),
                "status": "fail"
            }

            # 토픽 지정
            topic = KAFKA_STATUS_TOPIC

            # 메시지 발행
            producer.produce(
                topic,
                key=str(pipeline_id) if pipeline_id else "unknown",
                value=json.dumps(message).encode('utf-8'),
                callback=lambda err, msg: print(
                    f"[Producer] 메시지 전송 완료: {msg.topic()}" if err is None else f"[Producer] 메시지 전송 실패: {err}")
            )

            # 모든 메시지가 발행될 때까지 대기
            producer.flush()

            print(f"[Task] 학습 실패 메시지가 Kafka에 성공적으로 발행됨: {topic}")

        except Exception as kafka_error:
            print(f"[Task] Kafka 메시지 발행 중 오류 발생: {kafka_error}")

        print(f"[Task] Error during model training: {e}")
        return error_result