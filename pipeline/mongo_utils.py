from pymongo import MongoClient
import os
from config import (
    MONGODB_URI,
    MONGODB_DATABASE,
    MONGODB_COLLECTION
)
import json
from bson import json_util

# MongoDB 클라이언트 초기화
def get_mongo_client():
    """MongoDB 클라이언트를 반환합니다."""
    try:
        client = MongoClient(MONGODB_URI)
        return client
    except Exception as e:
        print(f"[MongoDB] Error connecting to MongoDB: {e}")
        return None

def ensure_string_keys(obj):
    """모든 딕셔너리 키가 문자열인지 확인하고 변환합니다."""
    if isinstance(obj, dict):
        return {str(k): ensure_string_keys(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [ensure_string_keys(item) for item in obj]
    elif isinstance(obj, (int, float)):
        return float(obj) if isinstance(obj, float) else int(obj)
    else:
        return obj

def save_to_mongodb(model_metadata):
    """모델 메타데이터를 MongoDB에 저장합니다."""
    try:
        # MongoDB 연결
        client = get_mongo_client()
        if not client:
            return None

        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]

        # 디버깅: 문제가 있는 필드 찾기
        def find_problematic_fields(data, path=""):
            if isinstance(data, dict):
                for key, value in data.items():
                    if not isinstance(key, str):
                        print(f"[MongoDB] 문제가 있는 키 발견: {path}.{key} (타입: {type(key)})")
                    find_problematic_fields(value, f"{path}.{key}" if path else f"{key}")
            elif isinstance(data, list):
                for i, item in enumerate(data):
                    find_problematic_fields(item, f"{path}[{i}]")

        print("[MongoDB] 문제가 있는 필드 검사 시작...")
        find_problematic_fields(model_metadata)

        # 모든 키를 문자열로 변환
        model_metadata = ensure_string_keys(model_metadata)

        # 직접 모델 메타데이터 로깅
        print(f"[MongoDB] 저장할 메타데이터 구조: {json.dumps(model_metadata, default=str)[:500]}...")

        # 문서 삽입 전 데이터를 BSON으로 변환 시도
        from bson import BSON
        try:
            # BSON 변환 테스트 (오류 발견용)
            bson_data = BSON.encode(model_metadata)
            print(f"[MongoDB] BSON 변환 성공. 크기: {len(bson_data)} 바이트")
        except Exception as bson_error:
            print(f"[MongoDB] BSON 변환 실패: {bson_error}")
            # 오류가 발생한 경우 구조를 더 자세히 검사
            if "must be an instance of str" in str(bson_error):
                for key in model_metadata:
                    value = model_metadata[key]
                    print(f"[MongoDB] 최상위 필드 '{key}' 타입: {type(key)}")
                    if isinstance(value, dict):
                        for subkey in value:
                            print(f"[MongoDB] 서브필드 '{key}.{subkey}' 타입: {type(subkey)}")
            raise

        # 문서 삽입
        result = collection.insert_one(model_metadata)

        print(f"[MongoDB] Model metadata saved with ID: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        print(f"[MongoDB] Error saving model metadata: {e}")
        # 오류 스택 추적 출력
        import traceback
        print(f"[MongoDB] 오류 스택 추적: {traceback.format_exc()}")
        return None
    finally:
        if client:
            client.close()

def get_model_by_id(model_id):
    """ID로 모델 메타데이터를 조회합니다."""
    try:
        from bson.objectid import ObjectId

        client = get_mongo_client()
        if not client:
            return None

        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]

        # ObjectId로 변환
        if isinstance(model_id, str):
            model_id = ObjectId(model_id)

        # 문서 조회
        model_doc = collection.find_one({"_id": model_id})

        if model_doc:
            # BSON을 JSON으로 변환 (ObjectId 처리)
            return json.loads(json_util.dumps(model_doc))
        else:
            return None
    except Exception as e:
        print(f"[MongoDB] Error retrieving model: {e}")
        return None
    finally:
        if client:
            client.close()

def get_models_by_pipeline_id(pipeline_id):
    """파이프라인 ID로 모델 메타데이터를 조회합니다."""
    try:
        client = get_mongo_client()
        if not client:
            return []

        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]

        # 파이프라인 ID로 문서 조회
        cursor = collection.find({"pipeline_id": pipeline_id})

        # 커서를 리스트로 변환
        models = list(cursor)

        if models:
            # BSON을 JSON으로 변환 (ObjectId 처리)
            return json.loads(json_util.dumps(models))
        else:
            return []
    except Exception as e:
        print(f"[MongoDB] Error retrieving models by pipeline ID: {e}")
        return []
    finally:
        if client:
            client.close()

def get_models_by_project_id(project_id):
    """프로젝트 ID로 모델 메타데이터를 조회합니다."""
    try:
        client = get_mongo_client()
        if not client:
            return []

        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]

        # 프로젝트 ID로 문서 조회
        cursor = collection.find({"project_id": project_id})

        # 커서를 리스트로 변환
        models = list(cursor)

        if models:
            # BSON을 JSON으로 변환 (ObjectId 처리)
            return json.loads(json_util.dumps(models))
        else:
            return []
    except Exception as e:
        print(f"[MongoDB] Error retrieving models by project ID: {e}")
        return []
    finally:
        if client:
            client.close()

def update_model_description(model_id, title=None, description=None):
    """모델 제목과 설명을 업데이트합니다."""
    try:
        from bson.objectid import ObjectId

        client = get_mongo_client()
        if not client:
            return False

        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]

        # ObjectId로 변환
        if isinstance(model_id, str):
            model_id = ObjectId(model_id)

        # 업데이트할 필드 구성
        update_fields = {}
        if title:
            update_fields["model_title"] = title
        if description:
            update_fields["model_description"] = description

        if not update_fields:
            return False

        # 문서 업데이트
        result = collection.update_one(
            {"_id": model_id},
            {"$set": update_fields}
        )

        return result.modified_count > 0
    except Exception as e:
        print(f"[MongoDB] Error updating model: {e}")
        return False
    finally:
        if client:
            client.close()

def update_model_api_endpoint(model_id, api_endpoint):
    """모델 API 엔드포인트를 업데이트합니다."""
    try:
        from bson.objectid import ObjectId

        client = get_mongo_client()
        if not client:
            return False

        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]

        # ObjectId로 변환
        if isinstance(model_id, str):
            model_id = ObjectId(model_id)

        # 문서 업데이트
        result = collection.update_one(
            {"_id": model_id},
            {"$set": {"api_endpoint": api_endpoint}}
        )

        return result.modified_count > 0
    except Exception as e:
        print(f"[MongoDB] Error updating API endpoint: {e}")
        return False
    finally:
        if client:
            client.close()

def update_model_by_pipeline_id(pipeline_id, update_data):
    """파이프라인 ID로 모델을 찾아 지정된 필드를 업데이트합니다.
    이미 존재하는 모델이 있으면 업데이트하고, 없으면 새로 삽입합니다.

    Args:
        pipeline_id (str): 파이프라인 ID
        update_data (dict): 업데이트할 데이터

    Returns:
        str: 업데이트/삽입된 문서의 ID
    """
    try:
        client = get_mongo_client()
        if not client:
            return None

        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]

        # 키를 문자열로 변환
        update_data = ensure_string_keys(update_data)

        # 디버깅을 위한 필드 검사
        print("[MongoDB] 업데이트할 데이터의 필드 검사 시작...")
        def find_problematic_fields(data, path=""):
            if isinstance(data, dict):
                for key, value in data.items():
                    if not isinstance(key, str):
                        print(f"[MongoDB] 문제가 있는 키 발견: {path}.{key} (타입: {type(key)})")
                    find_problematic_fields(value, f"{path}.{key}" if path else f"{key}")
            elif isinstance(data, list):
                for i, item in enumerate(data):
                    find_problematic_fields(item, f"{path}[{i}]")

        find_problematic_fields(update_data)

        # 파이프라인 ID로 기존 문서 검색
        existing_model = collection.find_one({"pipeline_id": pipeline_id})

        if existing_model:
            # 기존 문서 업데이트
            print(f"[MongoDB] 파이프라인 ID '{pipeline_id}'에 대한 기존 모델을 업데이트합니다.")

            # 업데이트할 필드 지정
            update_fields = {
                "algorithm": update_data.get("algorithm"),
                "parameters": update_data.get("parameters"),
                "train_info": update_data.get("train_info"),
                "performance": update_data.get("performance"),
                "feature_importance": update_data.get("feature_importance"),
                "learning_duration": float(update_data.get("learning_duration", 0)),  # 실수로 변환
                "model_file_path": update_data.get("model_file_path"),
                "api_endpoint": update_data.get("api_endpoint"),
                "registered_at": update_data.get("registered_at")
            }

            # None 값을 가진 필드 제거
            update_fields = {k: v for k, v in update_fields.items() if v is not None}

            result = collection.update_one(
                {"pipeline_id": pipeline_id},
                {"$set": update_fields}
            )

            print(f"[MongoDB] 모델 업데이트 완료: {result.modified_count} 문서 수정됨")
            return str(existing_model["_id"])
        else:
            # 새 문서 삽입
            print(f"[MongoDB] 파이프라인 ID '{pipeline_id}'에 대한 모델이 없어 새로 삽입합니다.")
            result = collection.insert_one(update_data)
            print(f"[MongoDB] 새 모델 메타데이터 저장됨, ID: {result.inserted_id}")
            return str(result.inserted_id)
    except Exception as e:
        print(f"[MongoDB] 모델 업데이트 오류: {e}")
        # 오류 스택 추적 출력
        import traceback
        print(f"[MongoDB] 오류 스택 추적: {traceback.format_exc()}")
        return None
    finally:
        if client:
            client.close()