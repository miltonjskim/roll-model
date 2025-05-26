def client_preprocess_step_label_mapper(preprocess_type: str) -> str:
    """
    서버 전처리 단계 유형을 프론트엔드 카테고리로 매핑합니다.
    
    Args:
        preprocess_type: 서버 전처리 단계 유형
        
    Returns:
        str: 프론트엔드에서 사용할 카테고리 유형
    """
    type_map = {
        # 결측치 처리 → MISSING_VALUES
        "MISSING_VALUE_IMPUTATION": "MISSING_VALUES",
        "MISSING_VALUE_REMOVE": "MISSING_VALUES",
        
        # 이상치 처리 → OUTLIER_HANDLE
        "OUTLIER_DETECTION": "OUTLIER_DETECTION",
        "OUTLIER_IMPUTATION": "OUTLIER_HANDLE",
        "OUTLIER_REMOVE": "OUTLIER_HANDLE",
        
        # 데이터 변환 → DATA_TRANSFORMATION
        "ZSCORE_SCALING": "DATA_TRANSFORMATION",
        "MINMAX_SCALING": "DATA_TRANSFORMATION",
        "LOG_TRANSFORM": "DATA_TRANSFORMATION",
        "SQRT_TRANSFORM": "DATA_TRANSFORMATION",
        
        # 인코딩 → ENCODING
        "ONEHOT_ENCODING": "ENCODING",
        "LABEL_ENCODING": "ENCODING", 
        "TARGET_ENCODING": "ENCODING",
        
        # 클래스 균형 → CLASS_BALANCING
        "CLASS_BALANCING": "CLASS_BALANCING",
        
        # 컬럼 처리 → COLUMN_MANAGEMENT
        "COLUMN_DROP": "COLUMN_MANAGEMENT",
        "COLUMN_KEEP": "COLUMN_MANAGEMENT"
    }
    
    # 매핑이 없는 경우 기본값 설정
    return type_map.get(preprocess_type, "OTHER")