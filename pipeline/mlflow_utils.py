import mlflow
import mlflow.sklearn
import os
from config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY

# MLflow 서버 주소 설정
MLFLOW_TRACKING_URI = os.environ.get("MLFLOW_TRACKING_URI")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

# MinIO를 MLflow 아티팩트 저장소로 설정
os.environ['MLFLOW_S3_ENDPOINT_URL'] = f"http://{MINIO_ENDPOINT}"
os.environ['AWS_ACCESS_KEY_ID'] = MINIO_ACCESS_KEY
os.environ['AWS_SECRET_ACCESS_KEY'] = MINIO_SECRET_KEY

def log_model_to_mlflow(model, model_type, model_params, metrics,
                        feature_importance, pipeline_id=None,
                        project_id=None, features_info=None, target_column=None):
    """MLflow에 모델 및 메타데이터 로깅"""
    # 실험 설정
    experiment_name = f"project_{project_id}" if project_id else "default"
    mlflow.set_experiment(experiment_name)

    # MLflow 실행 생성
    with mlflow.start_run(run_name=f"{model_type}_{pipeline_id}" if pipeline_id else model_type) as run:
        # 모델 파라미터 기록
        for param_name, param_value in model_params.items():
            mlflow.log_param(param_name, param_value)

        # 모델 메트릭 기록
        if "classification" in metrics:
            classification_metrics = metrics["classification"]
            mlflow.log_metric("accuracy", classification_metrics.get("accuracy", 0))
            mlflow.log_metric("precision", classification_metrics.get("precision", 0))
            mlflow.log_metric("recall", classification_metrics.get("recall", 0))
            mlflow.log_metric("f1_score", classification_metrics.get("f1_score", 0))
            if "auc" in classification_metrics:
                mlflow.log_metric("auc", classification_metrics["auc"])

        elif "regression" in metrics:
            regression_metrics = metrics["regression"]
            mlflow.log_metric("r_squared", regression_metrics.get("r_squared", 0))
            mlflow.log_metric("mae", regression_metrics.get("mae", 0))
            mlflow.log_metric("mse", regression_metrics.get("mse", 0))
            mlflow.log_metric("rmse", regression_metrics.get("rmse", 0))

        # 특성 중요도 기록
        for feature, importance in feature_importance.items():
            mlflow.log_metric(f"importance_{feature}", importance)

        # 태그 설정
        mlflow.set_tag("model_type", model_type)
        if pipeline_id:
            mlflow.set_tag("pipeline_id", pipeline_id)
        if project_id:
            mlflow.set_tag("project_id", project_id)

        # 모델 저장
        mlflow.sklearn.log_model(model, "model")

        # 모델 등록 (Model Registry에 등록)
        model_name = f"{model_type}_{project_id}" if project_id else model_type
        model_uri = f"runs:/{run.info.run_id}/model"
        registered_model = mlflow.register_model(model_uri, model_name)

        return {
            "run_id": run.info.run_id,
            "experiment_id": run.info.experiment_id,
            "model_uri": model_uri,
            "registered_model": model_name,
            "registered_model_version": registered_model.version
        }

def trigger_airflow_dag(run_info, celery_task_id=None, pipeline_id=None):
    """MLflow 모델 등록 후 Airflow DAG 트리거"""
    import requests
    import time

    airflow_api_url = os.environ.get(
        "AIRFLOW_API_URL",
        "http://airflow-webserver:8080/api/v1/dags/ml_deployment_pipeline/dagRuns"
    )

    # 기본 인증 정보 (실제 환경에서는 보안 자격 증명 사용)
    auth_header = os.environ.get("AIRFLOW_AUTH_HEADER", "Basic YWlyZmxvdzphaXJmbG93")

    headers = {
        'Content-Type': 'application/json',
        'Authorization': auth_header
    }

    # DAG에 전달할 설정
    payload = {
        'dag_run_id': f'mlflow_{run_info["run_id"]}_{int(time.time())}',
        'conf': {
            'run_id': run_info["run_id"],
            'experiment_id': run_info["experiment_id"],
            'model_uri': run_info["model_uri"],
            'registered_model': run_info["registered_model"],
            'model_version': run_info["registered_model_version"],
            'celery_task_id': celery_task_id,
            'pipeline_id': pipeline_id
        }
    }

    try:
        response = requests.post(airflow_api_url, headers=headers, json=payload)
        if response.status_code == 200:
            print(f"Airflow DAG 트리거 성공: {response.json()}")
            return True
        else:
            print(f"Airflow DAG 트리거 실패: {response.status_code}, {response.text}")
            return False
    except Exception as e:
        print(f"Airflow DAG 트리거 오류: {e}")
        return False