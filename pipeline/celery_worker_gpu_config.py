"""
Celery Worker GPU 설정 관리 모듈

이 모듈은 각 Celery Worker의 GPU 사용량을 설정하고 관리합니다.
환경 변수를 통해 GPU 사용 비율을 제한하는 TensorFlow/PyTorch 설정을 적용합니다.
"""

import os
import logging
import tensorflow as tf
from tensorflow.config.experimental import set_memory_growth, set_virtual_device_configuration, \
    VirtualDeviceConfiguration
import torch

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("celery_gpu_config")


def configure_gpu():
    """Worker에 할당된 GPU 설정 적용"""
    # 환경 변수에서 Worker ID와 GPU 할당 비율 가져오기
    worker_id = os.getenv('WORKER_ID', '0')
    gpu_percent = float(os.getenv('GPU_PERCENT', '12'))

    logger.info(f"Worker {worker_id} GPU 설정 적용 중 (할당: {gpu_percent}%)")

    # TensorFlow GPU 메모리 제한 설정
    try:
        # 사용 가능한 GPU 확인
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            gpu = gpus[0]  # 첫 번째 GPU 사용

            # 메모리 성장 설정
            set_memory_growth(gpu, True)

            # GPU 메모리 사용량 제한 (전체 메모리의 설정된 비율만 사용)
            gpu_memory_mb = int(16384 * (gpu_percent / 100))  # g4dn.xlarge는 16GB GPU
            set_virtual_device_configuration(
                gpu,
                [VirtualDeviceConfiguration(memory_limit=gpu_memory_mb)]
            )

            logger.info(f"TensorFlow GPU 메모리 제한: {gpu_memory_mb}MB")
        else:
            logger.warning("TensorFlow: 사용 가능한 GPU를 찾을 수 없습니다")
    except Exception as e:
        logger.error(f"TensorFlow GPU 설정 중 오류 발생: {e}")

    # PyTorch GPU 메모리 제한 설정
    try:
        if torch.cuda.is_available():
            # 총 GPU 메모리의 비율로 제한
            total_memory = torch.cuda.get_device_properties(0).total_memory
            max_memory = int(total_memory * (gpu_percent / 100))

            # PyTorch 2.0 이상에서는 메모리 제한을 설정할 수 있음
            if hasattr(torch.cuda, 'set_per_process_memory_fraction'):
                torch.cuda.set_per_process_memory_fraction(gpu_percent / 100)
                logger.info(f"PyTorch GPU 메모리 비율 제한: {gpu_percent}%")
            else:
                # 이전 버전의 PyTorch에서는 low-level 함수를 사용하여 수동으로 관리
                logger.info(f"PyTorch 이전 버전: GPU 메모리 수동 관리 필요")

                # Garbage collector 설정 조정
                import gc
                gc.collect()
                torch.cuda.empty_cache()
        else:
            logger.warning("PyTorch: 사용 가능한 GPU를 찾을 수 없습니다")
    except Exception as e:
        logger.error(f"PyTorch GPU 설정 중 오류 발생: {e}")

    # scikit-learn 모델에서 사용하는 CUDA 환경변수 설정
    try:
        # CUDA_VISIBLE_DEVICES는 이미 설정됨 (Docker 환경에서)

        # CUDA_MEM_LIMIT_PERCENT 설정 (일부 라이브러리에서 지원)
        os.environ['CUDA_MEM_LIMIT_PERCENT'] = str(gpu_percent)

        logger.info(f"CUDA 환경 변수 설정 완료")
    except Exception as e:
        logger.error(f"CUDA 환경 변수 설정 중 오류 발생: {e}")

    return True