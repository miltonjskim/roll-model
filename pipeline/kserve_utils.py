import os
import yaml
import subprocess
import tempfile
import json
import time
import traceback
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

    print(f"[DEBUG] Original name: '{name}' -> Converted name: '{sanitized}'")
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
    try:
        print(f"[DEBUG] Starting InferenceService YAML generation - Model: '{model_name}', Path: '{model_path}'")

        # Jinja2 환경 설정
        template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
        print(f"[DEBUG] Template directory path: {template_dir}")

        if not os.path.exists(template_dir):
            print(f"[ERROR] Template directory does not exist: {template_dir}")
            # 대체 템플릿 디렉토리 확인
            alt_dir = './templates'
            if os.path.exists(alt_dir):
                template_dir = alt_dir
                print(f"[DEBUG] Using alternative template directory: {alt_dir}")
            else:
                print(f"[ERROR] Alternative template directory also does not exist: {alt_dir}")

        # 디렉토리 내용 확인
        print(f"[DEBUG] Template directory file list: {os.listdir(template_dir)}")

        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template('mlflow-inferenceservice_template.yaml.j2')

        # 템플릿 변수
        endpoint_url = MINIO_ENDPOINT_G4DN_KUBE
        print(f"[DEBUG] MinIO endpoint URL: {endpoint_url}")

        # 쿠버네티스 리소스 이름 규칙에 맞게 변환
        service_name = sanitize_k8s_name(model_name)
        print(f"[DEBUG] Service name to be created: {service_name}, GPU allocation: {gpu_fraction}")

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

        # 파일 내용 검증
        print(f"[DEBUG] Generated YAML content (first 500 chars):\n{rendered_yaml[:500]}...")

        # 파일 생성 성공 및 경로 로깅
        print(f"[INFO] InferenceService YAML file has been generated successfully.")
        print(f"[INFO] YAML file path: {yaml_path}")

        return yaml_path, service_name
    except Exception as e:
        print(f"[ERROR] Exception occurred while generating InferenceService YAML: {str(e)}")
        print(f"[TRACE] {traceback.format_exc()}")
        raise


def generate_virtual_service_yaml(service_name):
    """
    Jinja2 템플릿을 사용하여 VirtualService YAML 파일 생성

    Args:
        service_name: 서비스 이름 (KServe InferenceService의 이름)

    Returns:
        생성된 YAML 파일 경로
    """
    try:
        print(f"[DEBUG] Starting VirtualService YAML generation - Service: '{service_name}'")

        # Jinja2 환경 설정
        template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')

        if not os.path.exists(template_dir):
            print(f"[ERROR] Template directory does not exist: {template_dir}")
            alt_dir = './templates'
            if os.path.exists(alt_dir):
                template_dir = alt_dir
                print(f"[DEBUG] Using alternative template directory: {alt_dir}")

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

        # 파일 내용 검증
        print(f"[DEBUG] Generated VirtualService YAML content:\n{rendered_yaml}")

        # 파일 생성 성공 및 경로 로깅
        print(f"[INFO] VirtualService YAML file has been generated successfully.")
        print(f"[INFO] YAML file path: {yaml_path}")

        return yaml_path, service_name
    except Exception as e:
        print(f"[ERROR] Exception occurred while generating VirtualService YAML: {str(e)}")
        print(f"[TRACE] {traceback.format_exc()}")
        raise


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
        print(f"[DEBUG] Starting {resource_type} deployment - YAML path: {yaml_path}")

        # YAML 파일 내용 확인
        with open(yaml_path, 'r') as f:
            yaml_content = f.read()
            print(f"[DEBUG] YAML content to deploy {resource_type}:\n{yaml_content}")

        # kubectl 명령 실행
        print(f"[DEBUG] Executing kubectl command: kubectl apply -f {yaml_path}")

        start_time = time.time()
        result = subprocess.run(
            ['kubectl', 'apply', '-f', yaml_path],
            capture_output=True,
            text=True,
            check=True,
            timeout=30  # 30초 타임아웃 추가
        )
        elapsed_time = time.time() - start_time

        # 결과 분석
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        print(f"[DEBUG] kubectl command execution time: {elapsed_time:.2f} seconds")
        print(f"[DEBUG] Standard output: {stdout}")

        if stderr:
            print(f"[WARNING] Standard error: {stderr}")

        # kubectl 결과 확인
        if "created" in stdout or "configured" in stdout or "unchanged" in stdout:
            print(f"[INFO] {resource_type} deployment successful: {stdout}")
            return True, stdout
        else:
            print(f"[WARNING] {resource_type} deployment result is unexpected: {stdout}")
            return True, stdout  # 에러가 없으면 성공으로 간주

    except subprocess.TimeoutExpired as e:
        error_msg = f"{resource_type} deployment timeout (30 seconds): {str(e)}"
        print(f"[ERROR] {error_msg}")
        return False, error_msg

    except subprocess.CalledProcessError as e:
        error_msg = f"{resource_type} deployment error: {e.stderr}"
        print(f"[ERROR] {error_msg}")
        return False, error_msg

    except Exception as e:
        error_msg = f"Exception occurred during {resource_type} deployment: {str(e)}"
        print(f"[ERROR] {error_msg}")
        print(f"[TRACE] {traceback.format_exc()}")
        return False, error_msg


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
    try:
        print(f"[DEBUG] Starting model deployment - Model: '{model_name}', Path: '{model_path}'")
        print(
            f"[DEBUG] Deployment settings - GPU: {gpu_fraction}, CPU: {cpu_request}/{cpu_limit}, Memory: {memory_request}/{memory_limit}")

        # 1. InferenceService YAML 생성
        print(f"[DEBUG] Starting InferenceService YAML generation")
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
        print(f"[DEBUG] InferenceService YAML generated: {inference_yaml_path}, Service name: {service_name}")

        # 2. InferenceService 배포
        print(f"[DEBUG] Starting InferenceService deployment")
        success, message = deploy_kubernetes_resource(inference_yaml_path, "InferenceService")
        if not success:
            print(f"[ERROR] InferenceService deployment failed: {message}")
            return False, message, service_name, None

        print(f"[INFO] InferenceService '{service_name}' deployment completed: {message}")

        # 3. 배포 후 잠시 대기
        wait_time = 30
        print(f"[INFO] Waiting {wait_time} seconds for InferenceService initialization...")
        try:
            time.sleep(wait_time)
        except KeyboardInterrupt:
            print(f"[WARNING] Interrupted by user during wait")

        # 4. InferenceService 상태 확인
        print(f"[DEBUG] Checking InferenceService status...")
        try:
            check_cmd = f"kubectl get inferenceservice {service_name} -n {namespace} -o json"
            result = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)

            if result.returncode == 0:
                service_status = json.loads(result.stdout)
                status = service_status.get("status", {})
                conditions = status.get("conditions", [])

                # 상태 조건 확인 및 로깅
                is_ready = False
                for condition in conditions:
                    if condition.get("type") == "Ready":
                        is_ready = condition.get("status") == "True"
                        reason = condition.get("reason", "Unknown")
                        message = condition.get("message", "")
                        print(f"[DEBUG] Service ready status: {is_ready}, Reason: {reason}, Message: {message}")

                if not is_ready:
                    print(f"[WARNING] InferenceService is not ready yet. Service conditions: {conditions}")
            else:
                print(f"[WARNING] Failed to check InferenceService status: {result.stderr}")
        except Exception as e:
            print(f"[WARNING] Error while checking InferenceService status: {str(e)}")

        # 5. VirtualService YAML 생성
        print(f"[DEBUG] Starting VirtualService YAML generation")
        vs_yaml_path, service_name = generate_virtual_service_yaml(service_name)
        print(f"[DEBUG] VirtualService YAML generated: {vs_yaml_path}")

        # 6. VirtualService 배포
        print(f"[DEBUG] Starting VirtualService deployment")
        success, message = deploy_kubernetes_resource(vs_yaml_path, "VirtualService")
        if not success:
            print(
                f"[ERROR] VirtualService deployment failed: {message}, but InferenceService was deployed successfully")
            return False, f"InferenceService was deployed successfully but VirtualService deployment failed: {message}", service_name, None

        print(f"[INFO] VirtualService '{service_name}-vs' deployment completed: {message}")

        # 7. 임시 YAML 파일 정리 (선택적)
        try:
            print(f"[DEBUG] Cleaning up temporary YAML files...")
            os.unlink(inference_yaml_path)
            os.unlink(vs_yaml_path)
            print(f"[INFO] Temporary YAML files have been deleted.")
        except Exception as e:
            print(f"[WARNING] Error during cleanup of temporary files: {e}")

        # 8. 접근 URL 정보 제공
        endpoint_url = f"/v1/models/{service_name}:predict"
        print(f"[INFO] Model endpoint URL: {endpoint_url}")

        # 9. MongoDB에 엔드포인트 정보 직접 저장
        try:
            # 모델 이름에서 파이프라인 ID 추출 (모델 이름이 파이프라인 ID인 경우)
            pipeline_id = model_name
            print(f"[DEBUG] Pipeline ID for MongoDB update: {pipeline_id}")

            if pipeline_id:
                # MongoDB에 배포 정보 업데이트
                deployment_info = {
                    "deployment_status": "deployed",
                    "api_endpoint": endpoint_url,
                    "service_name": service_name,
                    "deployment_timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
                }
                print(f"[DEBUG] Deployment info to be saved to MongoDB: {json.dumps(deployment_info)}")

                update_result = update_model_by_pipeline_id(pipeline_id, deployment_info)
                if update_result:
                    print(f"[INFO] Deployment info has been updated in MongoDB: {json.dumps(deployment_info)}")
                else:
                    print(f"[WARNING] MongoDB update failed")
        except Exception as e:
            print(f"[WARNING] Error during MongoDB update: {e}")
            print(f"[TRACE] {traceback.format_exc()}")

        print(f"[INFO] Model '{model_name}' deployment process completed.")
        return True, f"Model '{model_name}' has been successfully deployed. Endpoint: {endpoint_url}", service_name, endpoint_url

    except Exception as e:
        print(f"[ERROR] Exception occurred during model deployment: {str(e)}")
        print(f"[TRACE] {traceback.format_exc()}")
        return False, f"Error during model deployment: {str(e)}", None, None
