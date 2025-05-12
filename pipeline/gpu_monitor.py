#!/usr/bin/env python3
"""
GPU 리소스 모니터링 및 자동 조정 스크립트

이 스크립트는 다음 작업을 수행합니다:
1. KServe InferenceService에서 사용 중인 GPU 리소스 모니터링
2. 리소스 사용량에 따라 추론 서비스 자동 조정
3. GPU 메모리 사용량이 위험 수준에 도달하면 알림 발송
"""

import os
import time
import subprocess
import json
import yaml
import logging
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("gpu_monitor.log")
    ]
)
logger = logging.getLogger("gpu_monitor")

# 설정 값
CHECK_INTERVAL = 60  # 초 단위 점검 간격
GPU_TRAINING_ALLOCATION = 0.6  # 학습용 GPU 할당량 (60%)
GPU_INFERENCE_MAX = 0.4  # 추론용 최대 GPU 할당량 (40%)
MAX_MODELS = 30  # 최대 모델 배포 수
DANGER_THRESHOLD = 0.95  # GPU 사용량 위험 임계값 (95%)


def get_nvidia_smi_output():
    """NVIDIA-SMI 명령어 실행하여 GPU 상태 가져오기"""
    try:
        cmd = "nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits"
        result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = result.stdout.decode().strip().split(',')

        # 메모리 사용량, 총 메모리, GPU 사용률 반환
        memory_used = float(output[0])
        memory_total = float(output[1])
        gpu_utilization = float(output[2])

        return {
            "memory_used": memory_used,
            "memory_total": memory_total,
            "memory_used_percent": memory_used / memory_total,
            "gpu_utilization": gpu_utilization / 100.0  # 백분율을 소수로 변환
        }
    except Exception as e:
        logger.error(f"GPU 상태 확인 중 오류 발생: {e}")
        return None


def get_inference_services():
    """현재 배포된 InferenceService 목록 가져오기"""
    try:
        cmd = "kubectl get inferenceservices -n default -o json"
        result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        services = json.loads(result.stdout.decode())
        return services.get("items", [])
    except Exception as e:
        logger.error(f"InferenceService 목록 조회 중 오류 발생: {e}")
        return []


def get_current_gpu_allocations():
    """현재 InferenceService에 할당된 GPU 리소스 총합 계산"""
    services = get_inference_services()
    total_gpu = 0.0

    for service in services:
        try:
            resources = service["spec"]["predictor"]["sklearn"]["resources"]
            limits = resources.get("limits", {})
            gpu_limit = float(limits.get("nvidia.com/gpu", 0))
            total_gpu += gpu_limit
        except (KeyError, ValueError):
            continue

    return total_gpu


def adjust_inference_resources(gpu_stats):
    """GPU 사용량에 따라 추론 리소스 자동 조정"""
    if not gpu_stats:
        return

    # 현재 배포된 서비스 및 GPU 할당량 확인
    services = get_inference_services()
    current_allocations = get_current_gpu_allocations()

    # 실제 GPU 메모리 사용량
    memory_percent = gpu_stats["memory_used_percent"]

    logger.info(f"현재 GPU 상태: 메모리 사용률 {memory_percent:.1%}, GPU 할당량 {current_allocations:.3f}")

    # 위험 수준 확인 및 조치
    if memory_percent > DANGER_THRESHOLD:
        logger.warning(f"⚠️ 위험: GPU 메모리 사용률 {memory_percent:.1%}!")

        # CPU 전용으로 전환이 필요한 서비스 찾기
        for service in services:
            try:
                name = service["metadata"]["name"]
                resources = service["spec"]["predictor"]["sklearn"]["resources"]
                limits = resources.get("limits", {})

                if "nvidia.com/gpu" in limits:
                    logger.info(f"서비스 {name}를 CPU 모드로 전환합니다")

                    # 패치 명령 - GPU 리소스 제거 및 CPU 리소스 증가
                    patch = {
                        "spec": {
                            "predictor": {
                                "sklearn": {
                                    "resources": {
                                        "requests": {
                                            "cpu": "300m",
                                            "memory": "512Mi"
                                        },
                                        "limits": {
                                            "cpu": "500m",
                                            "memory": "1Gi"
                                        }
                                    }
                                }
                            }
                        }
                    }

                    # 패치 적용
                    patch_cmd = f"kubectl patch inferenceservice {name} -n default --type=merge -p '{json.dumps(patch)}'"
                    subprocess.run(patch_cmd, shell=True)
                    break  # 한 번에 하나의 서비스만 조정
            except (KeyError, Exception) as e:
                logger.error(f"서비스 {name} 조정 중 오류: {e}")

    # 여유 있는 경우, CPU 모드 서비스를 GPU 모드로 전환 고려
    elif memory_percent < 0.7 and current_allocations < GPU_INFERENCE_MAX * 0.9:
        # 최소 GPU 할당량 계산
        available_gpu = GPU_INFERENCE_MAX - current_allocations
        if available_gpu >= 0.01:  # 최소 1% 이상 가용
            # CPU 전용 서비스 찾기 (GPU로 전환할 수 있는 서비스)
            cpu_only_services = []
            for service in services:
                try:
                    name = service["metadata"]["name"]
                    resources = service["spec"]["predictor"]["sklearn"]["resources"]
                    limits = resources.get("limits", {})

                    if "nvidia.com/gpu" not in limits:
                        cpu_only_services.append(name)
                except (KeyError, Exception):
                    continue

            if cpu_only_services:
                # 가장 처음 찾은 CPU 서비스를 GPU 모드로 전환
                service_name = cpu_only_services[0]
                gpu_fraction = min(0.03, available_gpu)  # 최대 3% 할당

                logger.info(f"서비스 {service_name}를 GPU 모드로 전환합니다 (GPU: {gpu_fraction:.3f})")

                # 패치 명령 - GPU 리소스 추가
                patch = {
                    "spec": {
                        "predictor": {
                            "sklearn": {
                                "resources": {
                                    "requests": {
                                        "cpu": "100m",
                                        "memory": "256Mi",
                                        "nvidia.com/gpu": f"{gpu_fraction}"
                                    },
                                    "limits": {
                                        "cpu": "300m",
                                        "memory": "512Mi",
                                        "nvidia.com/gpu": f"{gpu_fraction}"
                                    }
                                },
                                "env": [
                                    {"name": "NVIDIA_VISIBLE_DEVICES", "value": "all"},
                                    {"name": "NVIDIA_DRIVER_CAPABILITIES", "value": "compute,utility"},
                                    {"name": "CUDA_VISIBLE_DEVICES", "value": "0"},
                                    {"name": "NVIDIA_MEM_LIMIT", "value": "256"}
                                ]
                            }
                        }
                    }
                }

                # 패치 적용
                patch_cmd = f"kubectl patch inferenceservice {service_name} -n default --type=merge -p '{json.dumps(patch)}'"
                subprocess.run(patch_cmd, shell=True)


def main():
    """메인 루프 - 주기적으로 GPU 상태를 점검하고 리소스를 조정합니다"""
    logger.info("GPU 모니터링 서비스 시작")

    while True:
        try:
            # GPU 상태 확인
            gpu_stats = get_nvidia_smi_output()

            if gpu_stats:
                # 현재 시간 및 상태 로깅
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                logger.info(
                    f"[{now}] GPU 메모리: {gpu_stats['memory_used']:.0f}MB/{gpu_stats['memory_total']:.0f}MB ({gpu_stats['memory_used_percent']:.1%}), 사용률: {gpu_stats['gpu_utilization']:.1%}")

                # 리소스 자동 조정
                adjust_inference_resources(gpu_stats)

            # 다음 점검까지 대기
            time.sleep(CHECK_INTERVAL)

        except KeyboardInterrupt:
            logger.info("모니터링 서비스 종료")
            break
        except Exception as e:
            logger.error(f"예기치 않은 오류 발생: {e}")
            time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()