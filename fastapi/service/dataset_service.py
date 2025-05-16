"""
데이터셋 서비스 모듈
: 프로젝트 데이터셋 업로드 및 분석을 위한 핵심 서비스 로직

주요 기능:
- 데이터셋 파일 업로드 및 MinIO 저장
- MinIO ETag 값 추출 및 MySQL 데이터베이스 저장
- 데이터셋 분석 및 요약 정보 생성
- MongoDB 파이프라인 생성

트랜잭션 관리와 예외 처리를 담당, MinIO와 DB 간 연동 작업 처리
"""

import io
import json
import logging

import pandas as pd
from typing import Dict, Any, BinaryIO, List

from bson import ObjectId
from fastapi import HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from core.storage import get_minio_client
from schemas.mysql.schemas import ProjectDataset
import math
import numpy as np
from db.mongo_config import get_pipeline_collection, get_dataset_collection
from schemas.mongo.dataset import ColumnType, DatasetModel
from service.db.pipeline_mysql_service import create_mysql_pipeline
from service.storage.storage import add_index_to_csv
import chardet

logger = logging.getLogger()


def replace_nan_values(obj, round_decimals=None):
    """
    NaN 값을 "NaN" 문자열로 변환하고, 옵션으로 float 값 반올림

    Args:
        obj: 처리할 객체
        round_decimals: float 값을 반올림할 소수점 자릿수 (None이면 반올림 안함)
    """
    if isinstance(obj, dict):
        return {k: replace_nan_values(v, round_decimals) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan_values(item, round_decimals) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj):
            return "NaN"
        return round(obj, round_decimals) if round_decimals is not None else obj
    elif hasattr(obj, 'dtype') and np.issubdtype(obj.dtype, np.floating):
        if np.isnan(obj):
            return "NaN"
        float_value = float(obj)
        return round(float_value, round_decimals) if round_decimals is not None else float_value
    elif hasattr(obj, 'dtype') and np.issubdtype(obj.dtype, np.integer):
        if np.isnan(obj):
            return "NaN"
        return int(obj)
    else:
        return obj


"""
1️⃣ 데이터셋을 MinIO, MongoDB에 업로드하고 메타데이터 저장
"""
async def upload_dataset_and_save_metadata(
        db: Session,
        project_id: int,
        member_id: int,
        file: UploadFile,
        config_json: str,
        background_tasks: BackgroundTasks,
        category: str,
        domain: str,
        is_preprocessed: bool = False,
) -> Dict[str, Any]:
    try:
        config = json.loads(config_json)
        file_content = await file.read()
        minio_client = get_minio_client()
        bucket_name = "datasets"
        object_name = f"project_{project_id}/{file.filename}"

        utf_8_bytes = convert_to_utf8_bytes(file_content)
        file_io = io.BytesIO(utf_8_bytes)
        indexed_data = add_index_to_csv(file_io, encoding="UTF-8")

        # MinIO에 파일 업로드
        upload_success = await minio_client.upload_file(
            bucket_name=bucket_name,
            object_name=object_name,
            file_data=indexed_data,
            content_type=file.content_type,
            encoding=config.get("UTF-8")
        )

        if not upload_success:
            logger.error(f"파일 {object_name} 업로드 실패")
            raise HTTPException(status_code=500, detail="파일 업로드 실패")

        # MinIO에서 파일 메타데이터 가져오기
        stat = minio_client.client.stat_object(bucket_name, object_name)
        etag = stat.etag.strip('"')
        file_size = stat.size  # 파일 크기 가져오기

        # MySQL에 데이터셋 ETag 저장
        project_dataset = ProjectDataset(
            project_id=project_id,
            dataset_etag=etag
        )

        db.add(project_dataset)
        db.commit()
        db.refresh(project_dataset)

        logger.info(f"프로젝트 {project_id}의 데이터셋 ETag가 성공적으로 저장되었습니다: {etag}")

        # 데이터셋 분석
        file_io.seek(0)
        dataset_analysis = await analyze_dataset(file_io, config)

        # MongoDB에 데이터셋 정보 저장
        dataset_id = await store_dataset_to_mongodb(
            project_id=project_id,
            member_id=member_id,
            etag=etag,
            dataset_analysis=dataset_analysis,
            config=config,
            file_size=file_size,
            object_name=object_name,
            sample_data = dataset_analysis["data_sample"]["data"][:30] if dataset_analysis["data_sample"] and "data" in dataset_analysis["data_sample"] else [],
            category=category,
            domain=domain,
            is_preprocessed=is_preprocessed
        )

        # MongoDB에 파이프라인 생성 (먼저 MongoDB 문서를 생성하여 ObjectID 가져오기)
        mongo_pipeline_id = await create_pipeline_document(
            project_id=project_id,
            member_id=member_id,
            etag=etag,
            dataset_id=dataset_id,
            object_name=object_name
        )

        # MySQL에 파이프라인 데이터 저장 (MongoDB 파이프라인 ID 사용)
        mysql_pipeline_id = await create_mysql_pipeline(
            db=db,
            project_id=project_id,
            dataset_analysis=dataset_analysis,
            mongo_pipeline_id=str(mongo_pipeline_id)  # ObjectID를 문자열로 변환
        )
        logger.info(f"MySQL 파이프라인 생성 완료: {mysql_pipeline_id}")

        # 응답 결과 생성
        result = {
            "pipelineId": mysql_pipeline_id,  # MySQL 파이프라인 ID (MongoDB ObjectID 문자열)
            "datasetId": dataset_id,  # MongoDB 데이터셋 ID
            "summary": {
                "totalRows": dataset_analysis["total_rows"],
                "totalColumns": dataset_analysis["total_columns"],
                "filename": file.filename,
                "encoding": "UTF-8",
                "delimiter": config.get("delimiter", "comma")
            },
            "missingValues": dataset_analysis["missing_values"],
            "originalDatasets": dataset_analysis["data_sample"]
        }
        # 몽고DB에 데이터가 생긴 이후에 백그라운드 작업 진행
        background_tasks.add_task(
            calculate_and_update_statistics,
            result.get("datasetId"),
            result.get("originalDatasets").get("data"),
            config.get("columns")
        )

        # 커스텀 구분자가 있는 경우 추가
        if config.get("delimiter") == "other" and "customDelimiter" in config:
            result["summary"]["delimiter"] = "other"
            result["summary"]["customDelimiter"] = config["customDelimiter"]

        return result

    except json.JSONDecodeError as e:
        logger.error(f"설정 JSON 파싱 오류: {str(e)}")
        raise HTTPException(status_code=400, detail=f"설정 파싱 오류: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"데이터셋 업로드 및 메타데이터 저장 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"처리 중 오류 발생: {str(e)}")

"""
2️⃣ 데이터셋 파일을 분석하여 요약 정보 생성

이 함수는 나중에 utils/dataset_analyzer.py로 분리 가능

Args:
    file_io: 파일 객체
    config: 데이터셋 설정

Returns:
    Dict: 분석 결과
"""
async def analyze_dataset(file_io: BinaryIO, config: Dict[str, Any]) -> Dict[str, Any]:
    try:
        delimiter_map = {
            "comma": ",",
            "semicolon": ";",
            "tab": "\t",
            "other": config.get("customDelimiter", "|")
        }

        delimiter = delimiter_map.get(config.get("delimiter", "comma"), ",")
        has_header = config.get("hasHeader", False)
        file_io.seek(0)
        df = pd.read_csv(
            file_io,
            delimiter=delimiter,
            encoding="UTF-8",
            header=0 if has_header else None
        )

        if not has_header:
            if "columns" in config and len(config["columns"]) == len(df.columns):
                column_names = [col["name"] for col in config["columns"]]
                df.columns = column_names
            else:
                df.columns = [f"Column{i + 1}" for i in range(len(df.columns))]

        total_rows = len(df)
        total_columns = len(df.columns)

        missing_columns = []
        missing_details = {}

        for col in df.columns:
            missing_count = df[col].isna().sum()
            if missing_count > 0:
                missing_percentage = round((missing_count / total_rows) * 100, 2)
                # 모든 결측치 행 인덱스 가져오기 (제한 없음)
                missing_indices = df[df[col].isna()].index.tolist()

                missing_columns.append(col)
                missing_details[col] = {
                    "count": int(missing_count),
                    "percentage": missing_percentage,
                    "rowIndices": missing_indices
                }

        # 모든 데이터 포함
        # data_sample = {
        #     "columns": df.columns.tolist(),
        #     "data": df.to_dict(orient="records")  # 전체 데이터셋 반환
        # }

        data_sample = {
            "columns": df.columns.tolist(),
            "data": df.to_dict(orient="records")  # 지정된 행 수만 반환
        }

        return {
            "total_rows": total_rows,
            "total_columns": total_columns,
            "missing_values": {
                "columns": missing_columns,
                "details": missing_details
            },
            "data_sample": data_sample
        }

    except Exception as e:
        logger.error(f"데이터셋 분석 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터셋 분석 중 오류: {str(e)}")


"""
3️⃣ MongoDB에 파이프라인 문서 생성

Args:
    project_id: 프로젝트 ID
    member_id: 회원 ID
    etag: 원본 데이터셋 ETag

Returns:
    ObjectId: 생성된 파이프라인 문서의 ID
"""
async def create_pipeline_document(project_id: int, member_id: int, dataset_id:str, object_name: str, etag: str) -> Any:

    try:
        pipeline_collection = get_pipeline_collection()

        # 현재 시간
        now = datetime.now().isoformat() + "Z"

        # 파이프라인 문서 생성
        pipeline_doc = {
            "project_id": project_id,
            "member_id": member_id,
            "registered_at": now,
            "modified_at": now,
            "original_dataset_id": dataset_id,
            "original_dataset_object_name": object_name,
            "original_dataset_etag": etag,
            "history": []
        }

        # MongoDB에 삽입
        result = await pipeline_collection.insert_one(pipeline_doc)

        return result.inserted_id

    except Exception as e:
        logger.error(f"파이프라인 문서 생성 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"파이프라인 문서 생성 중 오류: {str(e)}")


"""
4️⃣ 분석된 데이터셋 정보를 MongoDB에 저장

Args:
    project_id (int): 프로젝트 ID
    member_id (int): 회원 ID
    file_name (str): 업로드된 파일명
    etag (str): MinIO에 저장된 파일의 ETag
    dataset_analysis (Dict[str, Any]): 데이터셋 분석 결과
    config (Dict[str, Any]): 데이터셋 설정 정보
    file_size (int): 파일 크기 (바이트)
    object_name (str): MinIO에 저장된 객체 이름

Returns:
    str: 생성된 MongoDB 문서의 ID

Raises:
    HTTPException: MongoDB 저장 중 오류 발생 시
"""
async def store_dataset_to_mongodb(
    project_id: int,
    member_id: int,
    etag: str,
    dataset_analysis: Dict[str, Any],
    config: Dict[str, Any],
    file_size: int,
    object_name: str,
    category: str,
    domain: str,
    sample_data: List,
    is_preprocessed: bool = False
) -> str:
    try:
        dataset_collection = get_dataset_collection()
        now = datetime.now().isoformat() + "Z"

        # 사용자가 제공한 타입을 우리 시스템의 ColumnType으로 매핑
        type_mapping = {
            "string": ColumnType.string.value,
            "datetime": ColumnType.datetime.value,
            "integer": ColumnType.integer.value,
            "boolean": ColumnType.boolean.value,
            "double": ColumnType.double.value,
        }

        # 데이터 타입 매핑
        data_types = {}
        if "columns" in config and len(config["columns"]) > 0:
            for column in config["columns"]:
                col_name = column["name"]
                col_type = column.get("type", "string")  # 기본값은 string
                data_types[col_name] = type_mapping.get(col_type.lower(), ColumnType.string.value)

        # 결측치 정보 변환
        missing_value_count = {}
        for col, details in dataset_analysis["missing_values"]["details"].items():
            missing_value_count[col] = details["count"]

        # 파일 타입 (항상 CSV)
        file_type = "CSV"

        # 커스텀 구분자 처리
        delimiter = config.get("delimiter", "comma")
        custom_delimiter = None
        if delimiter == "other" and "customDelimiter" in config:
            custom_delimiter = config["customDelimiter"]

        # MongoDB 데이터셋 문서 생성 (is_deleted 제거, is_preprocessed 추가)
        dataset_doc = {
            "project_id": project_id,
            "member_id": member_id,
            "registered_at": now,
            "modified_at": now,
            "dataset_file_path": f"storage/datasets/{object_name}",  # file_path → dataset_file_path로 변경
            "object_name": object_name,
            "file_size": file_size,
            "file_type": file_type,  # metadata에서 별도 필드로 이동
            "etag": etag,
            "is_preprocessed": is_preprocessed,  # is_deleted 대신 is_preprocessed 사용
            "sample_data": sample_data,
            "category": category,
            "domain": domain,
            "metadata": {
                "row_count": dataset_analysis["total_rows"],
                "column_count": dataset_analysis["total_columns"],
                "data_types": data_types,
                "missing_value_count": missing_value_count,
                "delimiter": delimiter,
                "custom_delimiter": custom_delimiter,
                "encoding": "UTF-8",
                "has_header": config.get("hasHeader", False),
                "statistics": {} # 틀에만 추가
            }
        }

        # MongoDB에 문서 저장
        result = await dataset_collection.insert_one(dataset_doc)
        logger.info(f"MongoDB에 데이터셋 저장 완료: {result.inserted_id}")

        return str(result.inserted_id)

    except Exception as e:
        logger.error(f"MongoDB에 데이터셋 저장 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"MongoDB에 데이터셋 저장 중 오류: {str(e)}")


async def calculate_and_update_statistics(
        dataset_id: str,
        data: List[Dict[str, Any]],
        columns: List[Dict[str, Any]]
) -> None:
    """
    데이터셋의 통계 정보를 계산하고 MongoDB에 업데이트하는 백그라운드 작업

    Args:
        dataset_id: MongoDB에 저장된 데이터셋 ID
        data: 데이터셋 데이터 (pandas DataFrame으로 변환될 딕셔너리 리스트)
        columns: [{"name":...,"type":...}, {}]
        data_types: 컬럼별 데이터 타입 매핑
    """
    try:
        logger.info("백그라운드 작업 중..")
        # 데이터프레임으로 변환
        df = pd.DataFrame(data)

        # 통계 정보를 저장할 객체 초기화
        numeric_features = {}
        categorical_features = {}
        correlation_matrix = None
        numeric_columns = []

        # 각 컬럼 타입에 따라 통계 계산
        for col in columns:
            col_name = col.get("name")
            if col_name in df.columns:
                col_type = col.get("type", ColumnType.string.value)

                # 숫자형 변수 처리
                # logger.info(f"{col_type}, {ColumnType.NUMERIC.value}")
                if col_type in ["integer", "double", "numeric", "number", "float"]:
                    try:
                        # 숫자형으로 변환
                        numeric_data = pd.to_numeric(df[col_name], errors='coerce')
                        numeric_columns.append(col_name)

                        # NaN 제외한 데이터만 사용
                        clean_data = numeric_data.dropna()

                        if len(clean_data) > 0:
                            # 히스토그램 계산 (7개 구간)
                            hist, bin_edges = np.histogram(clean_data, bins=7)
                            hist_values = hist.tolist()

                            # 기본 통계량 계산
                            numeric_features[col_name] = {
                                "mean": float(clean_data.mean()),
                                "median": float(clean_data.median()),
                                "std": float(clean_data.std() if len(clean_data) > 1 else 0),
                                "min": float(clean_data.min()),
                                "max": float(clean_data.max()),
                                "histogram": hist_values
                            }
                    except Exception as e:
                        logger.warning(f"컬럼 {col_name}의 숫자형 통계 계산 중 오류: {str(e)}")

                # 범주형 변수 처리
                elif col_type in ["string", "categorical", "boolean", "text", "char"]:
                    try:
                        # 값별 빈도수 계산
                        value_counts = df[col_name].value_counts().to_dict()

                        # NaN 또는 None 값 제외
                        value_counts = {
                            str(k): int(v) for k, v in value_counts.items()
                            if k is not None and not (isinstance(k, float) and math.isnan(k))
                        }

                        categorical_features[col_name] = {
                            "value_counts": value_counts,
                            "unique_count": len(value_counts)
                        }
                    except Exception as e:
                        logger.warning(f"컬럼 {col_name}의 범주형 통계 계산 중 오류: {str(e)}")
        logger.info("행렬 계산 작업 중..")
        # 상관관계 행렬 계산 (숫자형 변수가 2개 이상일 경우)
        if len(numeric_columns) > 1:
            try:
                # 숫자형 변수만 선택
                numeric_df = df[numeric_columns].apply(pd.to_numeric, errors='coerce')
                # 상관관계 행렬 계산
                corr_matrix: List = numeric_df.corr().fillna(0).values.tolist()
                correlation_matrix = corr_matrix
            except Exception as e:
                logger.warning(f"상관관계 행렬 계산 중 오류: {str(e)}")
        # 모든 통계 정보를 담은 객체 생성
        statistics = {
            "numeric_features": numeric_features,
            "categorical_features": categorical_features
        }

        if correlation_matrix:
            statistics["correlation_matrix"] = correlation_matrix

        logger.info("데이터 셋 업데이트 중..")
        # MongoDB에 통계 정보 업데이트
        dataset_collection = get_dataset_collection()
        await dataset_collection.update_one(
            {"_id": ObjectId(dataset_id)},
            {
                "$set": {
                    "metadata.statistics": statistics,
                    "modified_at": datetime.now().isoformat() + "Z"
                }
            }
        )

        logger.info(f"데이터셋 {dataset_id}의 통계 계산 및 업데이트 완료")

    except Exception as e:
        # 오류 발생 시 상태 업데이트
        logger.error(f"데이터셋 {dataset_id}의 통계 계산 중 오류 발생: {str(e)}")


import chardet


def convert_to_utf8_bytes(data: bytes) -> bytes:
    """
    바이트 데이터를 UTF-8 바이트로 변환
    """
    # 1. 원본 인코딩 감지
    detected = chardet.detect(data)
    encoding = detected['encoding'] or 'utf-8'

    # 2. 유니코드 문자열로 디코딩
    try:
        text = data.decode(encoding)
    except UnicodeDecodeError:
        text = fallback_decode(data)

    # 3. UTF-8로 인코딩
    return text.encode('utf-8')

def convert_to_utf8_string(data: bytes) -> str:
    """
    바이트 데이터를 UTF-8로 디코딩한 문자열로 변환
    """
    # UTF-8 바이트로 변환 후 디코딩
    utf8_bytes = convert_to_utf8_bytes(data)
    return utf8_bytes.decode('utf-8')

def fallback_decode(data: bytes) -> str:
    """
    여러 인코딩을 순서대로 시도
    """
    encodings = ['utf-8', 'euc-kr', 'cp949', 'iso-8859-1']

    for encoding in encodings:
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue

    # 모든 방법 실패 시 에러 무시하고 디코딩
    return data.decode('utf-8', errors='ignore')