from typing import Any

def to_camel_case(snake_str: str) -> str:
    """snake_case를 camelCase로 변환"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def convert_dict_to_camel_case(data: Any) -> Any:
    """딕셔너리의 키를 재귀적으로 camelCase로 변환"""
    if isinstance(data, dict):
        return {to_camel_case(k): convert_dict_to_camel_case(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_dict_to_camel_case(item) for item in data]
    else:
        return data