from typing import Any

def to_camel_case(snake_str: str) -> str:
    """snake_case를 camelCase로 변환"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def convert_dict_to_camel_case(data: Any, exclude_keys: list = None) -> Any:
    """딕셔너리의 키를 재귀적으로 camelCase로 변환
    
    Args:
        data: 변환할 데이터
        exclude_keys: 변환하지 않을 키 목록 (기본값: None)
    """
    if exclude_keys is None:
        exclude_keys = []
    
    if isinstance(data, dict):
        result = {}
        for k, v in data.items():
            if k in exclude_keys:
                # 제외 키는 원래 키 사용하고, 그 값도 그대로 유지 (하위로 내려가지 않음)
                result[k] = v
            else:
                # 제외 키가 아니면 카멜케이스로 변환하고 값은 재귀적으로 처리
                result[to_camel_case(k)] = convert_dict_to_camel_case(v, exclude_keys)
        return result
    elif isinstance(data, list):
        return [convert_dict_to_camel_case(item, exclude_keys) for item in data]
    else:
        return data