from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from kserve_utils import generate_inference_service_yaml, deploy_inference_service, get_inference_service_url, sanitize_k8s_name
import mlflow
import mlflow.sklearn
import os

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 6, 1),  # 날짜를 현재 연도로 업데이트
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'ml_deployment_pipeline',
    default_args=default_args,
    description='MLflow 모델 배포 파이프라인',
    schedule_interval=None,  # 수동 트리거
    catchup=False
)

# MLflow 설정
MLFLOW_TRACKING_URI = os.environ.get("MLFLOW_TRACKING_URI")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

def get_mlflow_model_info(**kwargs):
    """DAG에 전달된 MLflow 모델 정보 가져오기"""
    ti = kwargs['ti']
    dag_run = kwargs['dag_run']

    if not dag_run or not dag_run.conf:
        raise ValueError("DAG 실행 설정이 없습니다")

    conf = dag_run.conf
    run_id = conf.get('run_id')
    model_uri = conf.get('model_uri')
    registered_model = conf.get('registered_model')
    model_version = conf.get('model_version')
    pipeline_id = conf.get('pipeline_id')

    # 추가된 필드: project_id와 member_id
    project_id = conf.get('project_id')
    member_id = conf.get('member_id')

    if not run_id or not model_uri:
        raise ValueError("MLflow 실행 ID 또는 모델 URI가 없습니다")

    # XCom으로 모델 정보 공유
    ti.xcom_push(key='run_id', value=run_id)
    ti.xcom_push(key='model_uri', value=model_uri)
    ti.xcom_push(key='registered_model', value=registered_model)
    ti.xcom_push(key='model_version', value=model_version)
    ti.xcom_push(key='pipeline_id', value=pipeline_id)
    ti.xcom_push(key='project_id', value=project_id)
    ti.xcom_push(key='member_id', value=member_id)

    return {
        'run_id': run_id,
        'model_uri': model_uri,
        'registered_model': registered_model,
        'model_version': model_version,
        'pipeline_id': pipeline_id,
        'project_id': project_id,
        'member_id': member_id
    }

def promote_model_to_production(**kwargs):
    """MLflow에서 모델 상태를 Production으로 변경"""
    ti = kwargs['ti']
    registered_model = ti.xcom_pull(key='registered_model', task_ids='get_model_info')
    model_version = ti.xcom_pull(key='model_version', task_ids='get_model_info')

    if not registered_model or not model_version:
        raise ValueError("등록된 모델 정보가 없습니다")

    # 모델 상태를 Production으로 변경
    client = mlflow.tracking.MlflowClient()
    client.transition_model_version_stage(
        name=registered_model,
        version=model_version,
        stage="Production"
    )

    print(f"모델 {registered_model} 버전 {model_version}를 Production 단계로 승격했습니다")
    return True

def create_endpoint_config(**kwargs):
    """모델 서빙 엔드포인트 설정 생성"""
    ti = kwargs['ti']
    registered_model = ti.xcom_pull(key='registered_model', task_ids='get_model_info')
    model_version = ti.xcom_pull(key='model_version', task_ids='get_model_info')
    pipeline_id = ti.xcom_pull(key='pipeline_id', task_ids='get_model_info')
    project_id = ti.xcom_pull(key='project_id', task_ids='get_model_info')
    model_type = registered_model.split('_')[0] if '_' in registered_model else registered_model

    # 모델 유형에 따라 리소스 할당 결정
    # 간단한 ML 모델(회귀, 분류 모델)은 적은 리소스 할당
    is_light_model = model_type in ['LogisticRegression', 'ElasticNet', 'RandomForestRegressor',
                                    'RandomForestClassifier', 'GradientBoostingRegressor', 'GradientBoostingClassifier']

    # GPU 사용 비율 결정 (간단한 모델은 0.1, 복잡한 모델은 0.25)
    gpu_fraction = 0.05 if is_light_model else 0.2

    # CPU와 메모리 할당도 모델 복잡도에 따라 조정
    cpu_request = "100m" if is_light_model else "200m"
    cpu_limit = "300m" if is_light_model else "500m"
    memory_request = "256Mi" if is_light_model else "512Mi"
    memory_limit = "512Mi" if is_light_model else "1Gi"

    # 쿠버네티스 리소스 이름 규칙에 맞게 엔드포인트 이름 생성
    endpoint_name = sanitize_k8s_name(f"{registered_model}-v{model_version}")

    # 엔드포인트 설정
    endpoint_config = {
        'name': endpoint_name,
        'model_name': registered_model,
        'model_version': model_version,
        'replicas': 1,
        'resources': {
            'requests': {
                'cpu': cpu_request,
                'memory': memory_request,
                'nvidia.com/gpu': gpu_fraction
            },
            'limits': {
                'cpu': cpu_limit,
                'memory': memory_limit,
                'nvidia.com/gpu': gpu_fraction
            }
        },
        'gpu_fraction': gpu_fraction,
        'project_id': project_id,
        'pipeline_id': pipeline_id
    }

    ti.xcom_push(key='endpoint_config', value=endpoint_config)
    ti.xcom_push(key='endpoint_name', value=endpoint_name)
    ti.xcom_push(key='gpu_fraction', value=gpu_fraction)

    return endpoint_config

def deploy_model_kserve(**kwargs):
    """KServe InferenceService를 사용하여 MLflow 모델 배포"""
    ti = kwargs['ti']
    registered_model = ti.xcom_pull(key='registered_model', task_ids='get_model_info')
    model_version = ti.xcom_pull(key='model_version', task_ids='get_model_info')
    run_id = ti.xcom_pull(key='run_id', task_ids='get_model_info')
    pipeline_id = ti.xcom_pull(key='pipeline_id', task_ids='get_model_info')
    project_id = ti.xcom_pull(key='project_id', task_ids='get_model_info')

    # 리소스 설정 가져오기
    endpoint_config = ti.xcom_pull(key='endpoint_config', task_ids='create_endpoint')

    # 리소스 추출
    gpu_fraction = endpoint_config.get('resources', {}).get('requests', {}).get('nvidia.com/gpu', 0)
    cpu_request = endpoint_config.get('resources', {}).get('requests', {}).get('cpu', '100m')
    cpu_limit = endpoint_config.get('resources', {}).get('limits', {}).get('cpu', '300m')
    memory_request = endpoint_config.get('resources', {}).get('requests', {}).get('memory', '256Mi')
    memory_limit = endpoint_config.get('resources', {}).get('limits', {}).get('memory', '512Mi')

    # 모델 이름 및 경로 설정
    model_name = f"{registered_model}-{model_version}"

    # 프로젝트 ID를 포함하여 경로 구성
    model_path = f"{project_id}/{run_id}/artifacts/model" if project_id else f"1/{run_id}/artifacts/model"

    # 쿠버네티스 리소스 이름 규칙에 맞게 변환
    k8s_model_name = sanitize_k8s_name(model_name)

    try:
        # InferenceService YAML 생성
        yaml_path = generate_inference_service_yaml(
            model_name=k8s_model_name,
            model_path=model_path,
            gpu_fraction=gpu_fraction,
            cpu_request=cpu_request,
            cpu_limit=cpu_limit,
            memory_request=memory_request,
            memory_limit=memory_limit
        )

        # InferenceService 배포
        deployment_success, deployment_message = deploy_inference_service(yaml_path)

        if deployment_success:
            service_url = get_inference_service_url(k8s_model_name)

            # 배포 정보
            deployment_info = {
                'status': 'deployed',
                'service_name': k8s_model_name,
                'url': service_url,
                'deployment_time': datetime.now().isoformat(),
                'resources': {
                    'gpu_usage': str(gpu_fraction),
                    'cpu_request': cpu_request,
                    'memory_request': memory_request
                }
            }

            ti.xcom_push(key='deployment_info', value=deployment_info)
            return deployment_info
        else:
            raise Exception(f"KServe 배포 실패: {deployment_message}")

    except Exception as e:
        print(f"모델 배포 오류: {e}")
        raise

def update_mongodb_deployment_status(**kwargs):
    """MongoDB에 배포 상태 업데이트"""
    from mongo_utils import update_model_by_pipeline_id

    ti = kwargs['ti']
    deployment_info = ti.xcom_pull(key='deployment_info', task_ids='deploy_model')
    pipeline_id = ti.xcom_pull(key='pipeline_id', task_ids='get_model_info')
    project_id = ti.xcom_pull(key='project_id', task_ids='get_model_info')
    member_id = ti.xcom_pull(key='member_id', task_ids='get_model_info')

    if not pipeline_id:
        print("파이프라인 ID가 없어 MongoDB 업데이트를 건너뜁니다.")
        return

    # 업데이트할 필드
    update_data = {
        'deployment_status': 'deployed',
        'api_endpoint': deployment_info['url'],
        'deployment_timestamp': deployment_info['deployment_time'],
        'project_id': project_id,
        'member_id': member_id
    }

    # MongoDB 업데이트
    result = update_model_by_pipeline_id(pipeline_id, update_data)
    if result:
        print(f"MongoDB 배포 상태 업데이트 성공: {pipeline_id}")
    else:
        print(f"MongoDB 배포 상태 업데이트 실패: {pipeline_id}")

# DAG 태스크 정의
get_model_info = PythonOperator(
    task_id='get_model_info',
    python_callable=get_mlflow_model_info,
    provide_context=True,
    dag=dag
)

promote_model = PythonOperator(
    task_id='promote_model',
    python_callable=promote_model_to_production,
    provide_context=True,
    dag=dag
)

create_endpoint = PythonOperator(
    task_id='create_endpoint',
    python_callable=create_endpoint_config,
    provide_context=True,
    dag=dag
)

deploy_model_task = PythonOperator(
    task_id='deploy_model',
    python_callable=deploy_model_kserve,
    provide_context=True,
    dag=dag
)

update_status = PythonOperator(
    task_id='update_status',
    python_callable=update_mongodb_deployment_status,
    provide_context=True,
    dag=dag
)

# 태스크 의존성 설정
get_model_info >> promote_model >> create_endpoint >> deploy_model_task >> update_status