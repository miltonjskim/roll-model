import os
import yaml
import subprocess
import tempfile
import json
from jinja2 import Environment, FileSystemLoader
from config import (
    MINIO_ENDPOINT,
    MINIO_SECURE,
    MINIO_ENDPOINT_G4DN,
    MINIO_ENDPOINT_G4DN_KUBE
)
from mongo_utils import get_mongo_client, update_model_by_pipeline_id


def sanitize_k8s_name(name):
    """
    쿠버네티스 리소스 이름 규칙에 맞게 변환
    - 소문자만 사용
    - 숫자와 하이픈('-') 허용
    - 알파벳으로 시작
    - 최대 63자
    """
    # 공백과 언더스코어를 하이픈으로 변경
    sanitized = name.replace('_', '-').replace(' ', '-').lower()

    # 숫자로 시작하면 'model-' 접두사 추가
    if sanitized and sanitized[0].isdigit():
        sanitized = f"model-{sanitized}"

    # 알파벳과 숫자, 하이픈 외 문자 제거
    import re
    sanitized = re.sub(r'[^a-z0-9\-]', '', sanitized)

    # 연속된 하이픈을 하나로 변경
    sanitized = re.sub(r'\-+', '-', sanitized)

    # 하이픈으로 시작하거나 끝나면 제거
    sanitized = sanitized.strip('-')

    # 이름이 비어있으면 기본값 설정
    if not sanitized:
        sanitized = "model"

    # 최대 길이 제한 (쿠버네티스는 63자까지 허용)
    if len(sanitized) > 63:
        sanitized = sanitized[:63].rstrip('-')

    return sanitized

def generate_inference_service_yaml(model_name, model_path, namespace="default", gpu_fraction=0.0, cpu_request="100m", cpu_limit="300m", memory_request="256Mi", memory_limit="512Mi"):
    """
    Jinja2 템플릿을 사용하여 InferenceService YAML 파일 생성

    Args:
        model_name: 모델 이름 (KServe 서비스 이름으로 사용)
        model_path: MinIO 내 모델 경로
        namespace: 쿠버네티스 네임스페이스
        gpu_fraction: GPU 사용 비율 (0=사용안함)
        cpu_request: 요청 CPU 리소스
        cpu_limit: 제한 CPU 리소스
        memory_request: 요청 메모리 리소스
        memory_limit: 제한 메모리 리소스

    Returns:
        생성된 YAML 파일 경로
    """
    # Jinja2 환경 설정
    template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('mlflow-inferenceservice_template.yaml.j2')

    # 템플릿 변수
    endpoint_url = MINIO_ENDPOINT_G4DN_KUBE

    # 쿠버네티스 리소스 이름 규칙에 맞게 변환
    service_name = sanitize_k8s_name(model_name)

    # 템플릿 렌더링
    rendered_yaml = template.render(
        model_name=service_name,
        model_path=model_path,
        namespace=namespace,
        endpoint_url=endpoint_url,
        gpu_fraction=gpu_fraction,
        cpu_request=cpu_request,
        cpu_limit=cpu_limit,
        memory_request=memory_request,
        memory_limit=memory_limit
    )

    # 임시 파일로 저장
    with tempfile.NamedTemporaryFile(suffix='.yaml', delete=False) as tmp:
        tmp.write(rendered_yaml.encode('utf-8'))
        yaml_path = tmp.name

    # 파일 생성 성공 및 경로 로깅
    print(f"[INFO] InferenceService YAML 파일이 성공적으로 생성되었습니다.")
    print(f"[INFO] YAML 파일 경로: {yaml_path}")

    return yaml_path, service_name

def generate_virtual_service_yaml(service_name):
    """
    Jinja2 템플릿을 사용하여 VirtualService YAML 파일 생성

    Args:
        service_name: 서비스 이름 (KServe InferenceService의 이름)
        namespace: 쿠버네티스 네임스페이스

    Returns:
        생성된 YAML 파일 경로
    """
    # Jinja2 환경 설정
    template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('virtualservice-template.yaml.j2')

    # 템플릿 렌더링
    rendered_yaml = template.render(
        service_name=service_name,
    )

    # 임시 파일로 저장
    with tempfile.NamedTemporaryFile(suffix='.yaml', delete=False) as tmp:
        tmp.write(rendered_yaml.encode('utf-8'))
        yaml_path = tmp.name

    # 파일 생성 성공 및 경로 로깅
    print(f"[INFO] VirtualService YAML 파일이 성공적으로 생성되었습니다.")
    print(f"[INFO] YAML 파일 경로: {yaml_path}")

    return yaml_path, service_name

def deploy_kubernetes_resource(yaml_path, resource_type="InferenceService"):
    """
    kubectl을 사용하여 쿠버네티스 리소스 배포

    Args:
        yaml_path: YAML 파일 경로
        resource_type: 리소스 타입 설명 (로깅용)

    Returns:
        성공 여부 (True/False), 결과 메시지
    """
    try:
        result = subprocess.run(
            ['kubectl', 'apply', '-f', yaml_path],
            capture_output=True,
            text=True,
            check=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, f"{resource_type} 배포 오류: {e.stderr}"

def deploy_model_with_virtual_service(
    model_name,
    model_path,
    namespace="default",
    gpu_fraction=0.0,
    cpu_request="100m",
    cpu_limit="300m",
    memory_request="256Mi",
    memory_limit="512Mi"
):
    """
    모델 배포를 위한 InferenceService와 VirtualService를 모두 생성하고 배포

    Args:
        model_name: 배포할 모델 이름
        model_path: MinIO 내부 모델 경로
        namespace: Kubernetes 네임스페이스
        gpu_fraction: 모델에 할당할 GPU 비율 (예: 0.1 = 10%)
        cpu_request: CPU 요청량
        cpu_limit: CPU 제한량
        memory_request: 메모리 요청량
        memory_limit: 메모리 제한량

    Returns:
        배포 성공 여부, 메시지, 서비스 이름, 서비스 URL
    """

    # 1. InferenceService YAML 생성
    inference_yaml_path, service_name = generate_inference_service_yaml(
        model_name,
        model_path,
        namespace,
        gpu_fraction,
        cpu_request,
        cpu_limit,
        memory_request,
        memory_limit
    )

    # 2. InferenceService 배포
    success, message = deploy_kubernetes_resource(inference_yaml_path, "InferenceService")
    if not success:
        return False, message, service_name, None

    print(f"[INFO] InferenceService '{service_name}' 배포 완료: {message}")

    # 3. 배포 후 잠시 대기
    import time
    print(f"[INFO] InferenceService가 초기화될 때까지 30초 대기...")
    time.sleep(30)

    # 4. VirtualService YAML 생성
    vs_yaml_path, service_name = generate_virtual_service_yaml(service_name)

    # 5. VirtualService 배포
    success, message = deploy_kubernetes_resource(vs_yaml_path, "VirtualService")
    if not success:
        return False, f"InferenceService는 성공적으로 배포되었으나, VirtualService 배포 실패: {message}", service_name

    print(f"[INFO] VirtualService '{service_name}-vs' 배포 완료: {message}")

    # 6. 임시 YAML 파일 정리 (선택적)
    try:
        os.unlink(inference_yaml_path)
        os.unlink(vs_yaml_path)
        print(f"[INFO] 임시 YAML 파일이 삭제되었습니다.")
    except Exception as e:
        print(f"[WARN] 임시 파일 정리 중 오류 발생: {e}")

    # 7. 접근 URL 정보 제공
    endpoint_url = f"/v1/models/{service_name}:predict"

    # 8. MongoDB에 엔드포인트 정보 직접 저장 (MLflow 의존성 제거)
    try:
        # 모델 이름에서 파이프라인 ID 추출 (모델 이름이 파이프라인 ID인 경우)
        pipeline_id = model_name

        if pipeline_id:
            # MongoDB에 배포 정보 업데이트
            deployment_info = {
                "deployment_status": "deployed",
                "api_endpoint": endpoint_url,
                "service_name": service_name,
                "deployment_timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
            }
            update_model_by_pipeline_id(pipeline_id, deployment_info)
            print(f"[INFO] MongoDB에 배포 정보가 업데이트되었습니다: {json.dumps(deployment_info)}")
    except Exception as e:
        print(f"[WARN] MongoDB 업데이트 중 오류 발생: {e}")

    return True, f"모델 '{model_name}'이(가) 성공적으로 배포되었습니다. 엔드포인트: {endpoint_url}", service_name, endpoint_url

