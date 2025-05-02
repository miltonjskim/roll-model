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
from typing import Dict, Any, BinaryIO
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime

from core.storage import get_minio_client
from schemas.mysql.schemas import ProjectDataset
from db.mongo_config import get_pipeline_collection
import math
import numpy as np
from schemas.mysql.schemas import Member
from db.mongo_config import get_pipeline_collection, get_dataset_collection
from schemas.mongo.dataset import DatasetDomain, DatasetCategory, ColumnType

logger = logging.getLogger()

def replace_nan_values(obj):
    """NaN 값을 None으로 변환"""
    if isinstance(obj, dict):
        return {k: replace_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan_values(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj):
            return "NaN"
        return obj
    elif hasattr(obj, 'dtype') and np.issubdtype(obj.dtype, np.floating):
        if np.isnan(obj):
            return "NaN"
        return float(obj)
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
        config_json: str
) -> Dict[str, Any]:
    try:
        config = json.loads(config_json)
        file_content = await file.read()
        file_io = io.BytesIO(file_content)
        minio_client = get_minio_client()
        bucket_name = "datasets"
        object_name = f"project_{project_id}/{file.filename}"

        # MinIO에 파일 업로드
        upload_success = minio_client.upload_file(
            bucket_name=bucket_name,
            object_name=object_name,
            file_data=file_io,
            content_type=file.content_type
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

        # MongoDB에 파이프라인 생성
        pipeline_id = await create_pipeline_document(project_id, member_id, etag)

        # MongoDB에 데이터셋 정보 저장
        dataset_id = await store_dataset_to_mongodb(
            project_id=project_id,
            member_id=member_id,
            file_name=file.filename,
            etag=etag,
            dataset_analysis=dataset_analysis,
            config=config,
            file_size=file_size,
            object_name=object_name
        )

        # 응답 결과 생성
        result = {
            "pipelineId": str(pipeline_id),
            "datasetId": dataset_id,  # 새로 생성된 데이터셋 ID 추가
            "summary": {
                "totalRows": dataset_analysis["total_rows"],
                "totalColumns": dataset_analysis["total_columns"],
                "filename": file.filename,
                "encoding": config.get("encoding", "UTF-8"),
                "delimiter": config.get("delimiter", "comma")
            },
            "missingValues": dataset_analysis["missing_values"],
            "original_datasets": dataset_analysis["data_sample"]
        }

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
        encoding = config.get("encoding", "UTF-8")
        has_header = config.get("hasHeader", False)

        df = pd.read_csv(
            file_io,
            delimiter=delimiter,
            encoding=encoding,
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
        data_sample = {
            "columns": df.columns.tolist(),
            "data": df.to_dict(orient="records")  # 전체 데이터셋 반환
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
async def create_pipeline_document(project_id: int, member_id: int, etag: str) -> Any:

    try:
        pipeline_collection = get_pipeline_collection()

        # 현재 시간
        now = datetime.utcnow().isoformat() + "Z"

        # 파이프라인 문서 생성
        pipeline_doc = {
            "project_id": project_id,
            "member_id": member_id,
            "registered_at": now,
            "modified_at": now,
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
    file_name: str,
    etag: str,
    dataset_analysis: Dict[str, Any],
    config: Dict[str, Any],
    file_size: int,
    object_name: str
) -> str:
    try:
        dataset_collection = get_dataset_collection()
        now = datetime.utcnow().isoformat() + "Z"

        # 사용자가 제공한 타입을 우리 시스템의 ColumnType으로 매핑
        type_mapping = {
            "string": ColumnType.CATEGORICAL.value,
            "datetime": ColumnType.DATETIME.value,
            "integer": ColumnType.NUMERIC.value,
            "boolean": ColumnType.CATEGORICAL.value,
            "double": ColumnType.NUMERIC.value
        }

        # 데이터 타입 매핑
        data_types = {}
        if "columns" in config and len(config["columns"]) > 0:
            for column in config["columns"]:
                col_name = column["name"]
                col_type = column.get("type", "string")  # 기본값은 string
                data_types[col_name] = type_mapping.get(col_type.lower(), ColumnType.CATEGORICAL.value)

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
            "file_size": file_size,
            "file_type": file_type,  # metadata에서 별도 필드로 이동
            "etag": etag,
            "is_preprocessed": False,  # is_deleted 대신 is_preprocessed 사용
            "category": DatasetCategory.CLASSIFICATION.value,
            "domain": DatasetDomain.GENERAL.value,
            "metadata": {
                "row_count": dataset_analysis["total_rows"],
                "column_count": dataset_analysis["total_columns"],
                "data_types": data_types,
                "missing_value_count": missing_value_count,
                "delimiter": delimiter,
                "custom_delimiter": custom_delimiter,
                "encoding": config.get("encoding", "UTF-8"),
                "has_header": config.get("hasHeader", False)
                # statistics 필드는 현재 구현에서 제외 (필요시 나중에 추가)
            }
        }

        # MongoDB에 문서 저장
        result = await dataset_collection.insert_one(dataset_doc)
        logger.info(f"MongoDB에 데이터셋 저장 완료: {result.inserted_id}")

        return str(result.inserted_id)

    except Exception as e:
        logger.error(f"MongoDB에 데이터셋 저장 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"MongoDB에 데이터셋 저장 중 오류: {str(e)}")