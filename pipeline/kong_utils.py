import os
import requests
import json
import logging
from pymongo import MongoClient
from bson.objectid import ObjectId
from config import (
    MONGODB_URI,
    MONGODB_DATABASE,
    MONGODB_COLLECTION
)

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("kong_utils")

# Kong Admin API 설정
KONG_ADMIN_HOST = os.getenv("KONG_ADMIN_HOST")
KONG_ADMIN_PORT = os.getenv("KONG_ADMIN_PORT")
KONG_ADMIN_URL = f"http://{KONG_ADMIN_HOST}:{KONG_ADMIN_PORT}"
KONG_PROXY_HOST = os.getenv("KONG_PROXY_HOST")
KONG_PROXY_PORT = os.getenv("KONG_PROXY_PORT")
KONG_PROXY_URL = f"http://{KONG_PROXY_HOST}:{KONG_PROXY_PORT}"

# MongoDB 클라이언트 초기화
def get_mongo_client():
    """MongoDB 클라이언트를 반환합니다."""
    try:
        client = MongoClient(MONGODB_URI)
        return client
    except Exception as e:
        logger.error(f"[MongoDB] Error connecting to MongoDB: {e}")
        return None

def create_service(service_name, service_url):
    """Kong에 서비스를 생성합니다."""
    try:
        url = f"{KONG_ADMIN_URL}/services"
        payload = {
            "name": service_name,
            "url": service_url
        }

        logger.info(f"Kong 서비스 생성 요청 URL: {url}")
        logger.info(f"Kong 서비스 생성 요청 페이로드: {json.dumps(payload, ensure_ascii=False)}")

        response = requests.post(url, json=payload)

        logger.info(f"Kong 응답 상태 코드: {response.status_code}")
        logger.info(f"Kong 응답 헤더: {response.headers}")
        logger.info(f"Kong 응답 내용: {response.text}")

        # 이미 존재하는 서비스인 경우 처리
        if response.status_code == 409:
            logger.info(f"서비스 '{service_name}'이(가) 이미 존재합니다.")
            return requests.get(f"{url}/{service_name}").json()

        response.raise_for_status()

        logger.info(f"Kong에 서비스 '{service_name}' 생성 완료")
        return response.json()
    except Exception as e:
        logger.error(f"Kong 서비스 생성 오류: {e}")
        return None

def create_route(service_name, route_name, paths=None, hosts=None):
    """서비스에 대한 라우트를 생성합니다."""
    try:
        url = f"{KONG_ADMIN_URL}/services/{service_name}/routes"

        payload = {"name": route_name}

        if paths:
            payload["paths"] = paths
        if hosts:
            payload["hosts"] = hosts

        # paths와 hosts 모두 None이면 기본 경로 설정
        if not paths and not hosts:
            payload["paths"] = [f"/{service_name}"]

        response = requests.post(url, json=payload)

        # 이미 존재하는 라우트인 경우 처리
        if response.status_code == 409:
            logger.info(f"라우트 '{route_name}'이(가) 이미 존재합니다.")
            return {"status": "already_exists", "name": route_name}

        response.raise_for_status()

        logger.info(f"Kong에 라우트 '{route_name}' 생성 완료")
        return response.json()
    except Exception as e:
        logger.error(f"Kong 라우트 생성 오류: {e}")
        return None

def create_consumer(consumer_id):
    """소비자를 생성합니다. 모델 ID 기반으로 사용자 ID 생성."""
    try:
        username = f"user-{consumer_id}"
        url = f"{KONG_ADMIN_URL}/consumers"
        payload = {"username": username}

        response = requests.post(url, json=payload)

        # 이미 존재하는 소비자인 경우 처리
        if response.status_code == 409:
            logger.info(f"소비자 '{username}'이(가) 이미 존재합니다.")
            return requests.get(f"{url}/{username}").json()

        response.raise_for_status()

        logger.info(f"Kong에 소비자 '{username}' 생성 완료")
        return response.json()
    except Exception as e:
        logger.error(f"Kong 소비자 생성 오류: {e}")
        return None

def create_key_auth(consumer_username):
    """소비자에 대한 API 키를 생성합니다."""
    try:
        url = f"{KONG_ADMIN_URL}/consumers/{consumer_username}/key-auth"
        response = requests.post(url)
        response.raise_for_status()

        key_data = response.json()
        logger.info(f"소비자 '{consumer_username}'에 대한 API 키 생성 완료")
        return key_data
    except Exception as e:
        logger.error(f"API 키 생성 오류: {e}")
        return None

def create_acl_group(service_name):
    """서비스 접근을 위한 ACL 그룹을 생성합니다."""
    try:
        group_name = f"group-{service_name}"
        return group_name
    except Exception as e:
        logger.error(f"ACL 그룹 생성 오류: {e}")
        return None

def add_consumer_to_acl_group(consumer_username, group_name):
    """소비자를 ACL 그룹에 추가합니다."""
    try:
        url = f"{KONG_ADMIN_URL}/consumers/{consumer_username}/acls"
        payload = {"group": group_name}

        response = requests.post(url, json=payload)

        # 이미 그룹에 속해 있는 경우
        if response.status_code == 409:
            logger.info(f"소비자 '{consumer_username}'는 이미 그룹 '{group_name}'에 속해 있습니다.")
            return {"status": "already_exists"}

        response.raise_for_status()

        logger.info(f"소비자 '{consumer_username}'를 ACL 그룹 '{group_name}'에 추가 완료")
        return response.json()
    except Exception as e:
        logger.error(f"ACL 그룹 추가 오류: {e}")
        return None

def enable_key_auth_plugin(route_name):
    """라우트에 key-auth 플러그인을 활성화합니다."""
    try:
        url = f"{KONG_ADMIN_URL}/routes/{route_name}/plugins"
        payload = {
            "name": "key-auth",
            "config.key_names": ["apikey"]
        }

        response = requests.post(url, json=payload)

        # 이미 플러그인이 활성화된 경우
        if response.status_code == 409:
            logger.info(f"라우트 '{route_name}'에 key-auth 플러그인이 이미 활성화되어 있습니다.")
            return {"status": "already_exists"}

        response.raise_for_status()

        logger.info(f"라우트 '{route_name}'에 key-auth 플러그인 활성화 완료")
        return response.json()
    except Exception as e:
        logger.error(f"key-auth 플러그인 활성화 오류: {e}")
        return None

def enable_acl_plugin(route_name, group_name):
    """라우트에 ACL 플러그인을 활성화합니다."""
    try:
        url = f"{KONG_ADMIN_URL}/routes/{route_name}/plugins"
        payload = {
            "name": "acl",
            "config.allow": [group_name]
        }

        response = requests.post(url, json=payload)

        # 이미 플러그인이 활성화된 경우
        if response.status_code == 409:
            logger.info(f"라우트 '{route_name}'에 ACL 플러그인이 이미 활성화되어 있습니다.")
            return {"status": "already_exists"}

        response.raise_for_status()

        logger.info(f"라우트 '{route_name}'에 ACL 플러그인 활성화 완료 (그룹: {group_name})")
        return response.json()
    except Exception as e:
        logger.error(f"ACL 플러그인 활성화 오류: {e}")
        return None

def save_api_info_by_pipeline_id(pipeline_id, api_info):
    """파이프라인 ID로 모델을 찾아 API 정보를 MongoDB에 저장합니다."""
    try:
        client = get_mongo_client()
        if not client:
            return False

        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]

        # 파이프라인 ID로 문서 업데이트
        result = collection.update_one(
            {"pipeline_id": pipeline_id},
            {"$set": {
                "api_key": api_info.get("api_key"),
                "api_endpoint": api_info.get("api_endpoint"),
                "consumer": api_info.get("consumer")
            }}
        )

        if result.modified_count > 0:
            logger.info(f"파이프라인 ID: {pipeline_id}에 대한 API 정보 저장 완료")
            return True
        else:
            logger.warning(f"파이프라인 ID: {pipeline_id}에 해당하는 모델을 찾을 수 없습니다.")
            return False
    except Exception as e:
        logger.error(f"API 정보 MongoDB 저장 오류: {e}")
        return False
    finally:
        if client:
            client.close()

def setup_model_api_gateway(pipeline_id, service_url, paths=None):
    """모델별 API Gateway 설정을 완료합니다.

    1. 모델 ID 기반 서비스 생성
    2. 서비스에 대한 라우트 생성
    3. 모델별 고유 소비자 생성
    4. ACL 그룹 생성 및 소비자 추가
    5. API 키 생성
    6. 라우트에 key-auth 및 ACL 플러그인 활성화
    """
    # 서비스 및 라우트 이름 생성
    service_name = f"model-{pipeline_id}"
    route_name = f"model-{pipeline_id}-route"

    if not paths:
        paths = [f"/model/{pipeline_id}"]

    result = {
        "status": "pending",
        "message": "",
        "api_endpoint": None,
        "api_key": None,
        "consumer": None
    }

    # 1. 서비스 생성
    service = create_service(service_name, service_url)
    if not service:
        result["status"] = "error"
        result["message"] = "서비스 생성 실패"
        return result

    # 2. 라우트 생성
    route = create_route(service_name, route_name, paths)
    if not route:
        result["status"] = "error"
        result["message"] = "라우트 생성 실패"
        return result

    # Kong API Endpoint 생성
    result["api_endpoint"] = f"{KONG_PROXY_URL}{paths[0]}"

    # 3. 모델별 소비자 생성
    consumer_username = f"user-{pipeline_id}"
    consumer = create_consumer(pipeline_id)
    if not consumer:
        result["status"] = "error"
        result["message"] = "소비자 생성 실패"
        return result

    result["consumer"] = consumer

    # 4. ACL 그룹 생성 및 소비자 추가
    group_name = create_acl_group(service_name)
    acl_result = add_consumer_to_acl_group(consumer_username, group_name)
    if not acl_result:
        result["status"] = "error"
        result["message"] = "ACL 그룹 설정 실패"
        return result

    # 5. API 키 생성
    api_key = create_key_auth(consumer_username)
    if not api_key:
        result["status"] = "error"
        result["message"] = "API 키 생성 실패"
        return result

    result["api_key"] = api_key

    # 6. 라우트에 key-auth 플러그인 활성화
    key_auth_plugin = enable_key_auth_plugin(route_name)
    if not key_auth_plugin:
        result["status"] = "error"
        result["message"] = "key-auth 플러그인 활성화 실패"
        return result

    # 7. 라우트에 ACL 플러그인 활성화
    acl_plugin = enable_acl_plugin(route_name, group_name)
    if not acl_plugin:
        result["status"] = "error"
        result["message"] = "ACL 플러그인 활성화 실패"
        return result

    # 모든 설정 완료
    result["status"] = "success"
    result["message"] = "API Gateway 설정 완료"

    return result