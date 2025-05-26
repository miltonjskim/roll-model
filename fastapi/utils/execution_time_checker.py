import time
import functools
import logging
import asyncio
from typing import Callable, Any

# 로거 설정
logger = logging.getLogger()

def execution_time(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    동기/비동기 함수 모두 지원하는 실행시간 로깅 데코레이터
    """
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            execution_time_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"'{func.__name__}' executed in {execution_time_ms:.2f}ms")
            return result
        except Exception as e:
            execution_time_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"'{func.__name__}' failed after {execution_time_ms:.2f}ms - Error: {e}")
            raise
    
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        try:
            result = await func(*args, **kwargs)
            execution_time_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"'{func.__name__}' executed in {execution_time_ms:.2f}ms")
            return result
        except Exception as e:
            execution_time_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"'{func.__name__}' failed after {execution_time_ms:.2f}ms - Error: {e}")
            raise
    
    # 비동기 함수인지 확인하여 적절한 래퍼 반환
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper