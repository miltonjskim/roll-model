from fastapi import APIRouter, Depends
from core.security import verify_token
from models.preprocessing.missing_value_models import MissingValueImputationRequest
import logging

logger = logging.getLogger()
router = APIRouter()

@router.post('/outliers/remove')
def remove_outliers(member_id: int = Depends(verify_token)):
    logger.info(f"Member ID: {member_id}")

    return "Outliers Removed"

@router.post('/outliers/transform')
def imputate_outliers(member_id: int = Depends(verify_token)):
    '''
    
    column : str
        처리할 컬럼 이름
    method : str
        탐지 방법 ('iqr', 'zscore')
    treatment : str
        처리 방법 ('cap', 'remove', 'mean', 'median')
    '''
    return "Transform outliers"

@router.post('/missing-values/remove')
def remove_missing_values(member_id: int = Depends(verify_token)):
    return "Missing values removed"

@router.post('/missing-values/transform')
def imputate_missing_values(request: MissingValueImputationRequest, member_id: int = Depends(verify_token)):
    """
    결측치 처리 API 응답 시뮬레이션
    
    Parameters:
    -----------
    pipeline_id : int
        파이프라인 ID
    -> 파이프라인에서 데이터셋 경로 찾기 -> 
    column : str
        처리할 컬럼 이름
    method : str
        대체 방법 ('mean', 'median', 'mode')

    로직
    1. 데이터셋 to dataframe
    2. 결측치 처리 + 바뀐 행 정보 보관
    3. 결과 redis 저장 
    4. 결과 반환
        
    Returns:
    --------
    dict
        API 응답 형식의 결과
    """



    return "Transform missing values"