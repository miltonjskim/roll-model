import os
import yaml
import subprocess
import tempfile
from jinja2 import Environment, FileSystemLoader
from config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_SECURE,
    MINIO_MODELS_BUCKET
)


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

def generate_inference_service_yaml(model_name, model_path, namespace="default", gpu_fraction=0, cpu_request="100m", cpu_limit="300m", memory_request="256Mi", memory_limit="512Mi"):
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
    endpoint_url = f"http://{MINIO_ENDPOINT}"
    if MINIO_SECURE:
        endpoint_url = f"https://{MINIO_ENDPOINT}"

    # 쿠버네티스 리소스 이름 규칙에 맞게 변환
    service_name = sanitize_k8s_name(model_name)

    # 템플릿 렌더링
    rendered_yaml = template.render(
        model_name=service_name,
        model_path=model_path,
        namespace=namespace,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
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

    return yaml_path

def deploy_inference_service(yaml_path):
    """
    kubectl을 사용하여 InferenceService 배포

    Args:
        yaml_path: InferenceService YAML 파일 경로

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
        return False, f"배포 오류: {e.stderr}"
    finally:
        # 임시 YAML 파일 삭제
        try:
            os.unlink(yaml_path)
        except:
            pass

def get_inference_service_url(service_name, namespace="default"):
    """
    배포된 InferenceService의 URL 조회

    Args:
        service_name: 서비스 이름
        namespace: 네임스페이스

    Returns:
        서비스 URL (문자열)
    """
    try:
        # InferenceService 상태 확인
        result = subprocess.run(
            ['kubectl', 'get', 'inferenceservice', service_name, '-n', namespace, '-o', 'jsonpath={.status.url}'],
            capture_output=True,
            text=True,
            check=True
        )
        service_url = result.stdout.strip()
        if not service_url:
            # URL을 찾을 수 없는 경우 기본 형식으로 추정
            service_url = f"http://{service_name}.{namespace}.example.com/v1/models/{service_name}:predict"

        return service_url
    except subprocess.CalledProcessError:
        # 서비스를 찾을 수 없는 경우 기본 URL 반환
        return f"http://{service_name}.{namespace}.example.com/v1/models/{service_name}:predict"