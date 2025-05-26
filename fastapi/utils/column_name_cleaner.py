def clean_column_name(col_name: str) -> str:
    """컬럼명에서 특수문자를 언더스코어로 변경"""
    import re
    # 괄호, 공백, 슬래시, 마이너스 등을 언더스코어로 변경
    cleaned = re.sub(r'[^\w가-힣]', '_', col_name)
    # 연속된 언더스코어를 하나로 변경
    cleaned = re.sub(r'_+', '_', cleaned)
    # 앞뒤 언더스코어 제거
    cleaned = cleaned.strip('_')
    return cleaned