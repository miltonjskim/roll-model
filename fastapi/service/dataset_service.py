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

async def upload_dataset_and_save_metadata(
        db: Session,
        project_id: int,
        member_id: int,
        file: UploadFile,
        config_json: str
) -> Dict[str, Any]:
    """
    데이터셋을 MinIO에 업로드하고 메타데이터 저장

    Args:
        db: 데이터베이스 세션
        project_id: 프로젝트 ID
        member_id: 회원 ID
        file: 업로드된 파일
        config_json: 데이터셋 설정 JSON 문자열

    Returns:
        Dict: 업로드 및 분석 결과 정보
    """
    try:
        # 설정 파싱
        config = json.loads(config_json)

        # 파일 읽기
        file_content = await file.read()
        file_io = io.BytesIO(file_content)

        # MinIO 클라이언트 가져오기
        minio_client = get_minio_client()
        bucket_name = "datasets"  # 환경 변수에서 가져올 수 있음

        # 객체 이름 생성 (프로젝트 ID 기반)
        object_name = f"project_{project_id}/{file.filename}"

        # 파일 업로드
        upload_success = minio_client.upload_file(
            bucket_name=bucket_name,
            object_name=object_name,
            file_data=file_io,
            content_type=file.content_type
        )

        if not upload_success:
            logger.error(f"파일 {object_name} 업로드 실패")
            raise HTTPException(status_code=500, detail="파일 업로드 실패")

        # 업로드된 객체의 etag 가져오기
        stat = minio_client.client.stat_object(bucket_name, object_name)
        etag = stat.etag

        # 따옴표가 포함된 경우 제거
        etag = etag.strip('"')

        # MySQL DB에 etag 저장
        project_dataset = ProjectDataset(
            project_id=project_id,
            dataset_etag=etag
        )

        # 데이터베이스에 저장
        db.add(project_dataset)
        db.commit()
        db.refresh(project_dataset)

        logger.info(f"프로젝트 {project_id}의 데이터셋 ETag가 성공적으로 저장되었습니다: {etag}")

        # 파일 다시 읽기 (분석용)
        file_io.seek(0)

        # 파일 분석 (이 부분은 별도 함수로 분리 가능)
        dataset_analysis = await analyze_dataset(file_io, config)

        # MongoDB에 파이프라인 정보 저장
        pipeline_id = await create_pipeline_document(project_id, member_id, etag)

        # 결과 구성
        result = {
            "pipelineId": str(pipeline_id),
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

        return result

    except json.JSONDecodeError as e:
        logger.error(f"설정 JSON 파싱 오류: {str(e)}")
        raise HTTPException(status_code=400, detail=f"설정 파싱 오류: {str(e)}")
    except Exception as e:
        # 트랜잭션 롤백
        db.rollback()
        logger.error(f"데이터셋 업로드 및 메타데이터 저장 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"처리 중 오류 발생: {str(e)}")


async def analyze_dataset(file_io: BinaryIO, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    데이터셋 파일을 분석하여 요약 정보 생성

    이 함수는 나중에 utils/dataset_analyzer.py로 분리 가능

    Args:
        file_io: 파일 객체
        config: 데이터셋 설정

    Returns:
        Dict: 분석 결과
    """
    try:
        # 구분자 매핑
        delimiter_map = {
            "comma": ",",
            "semicolon": ";",
            "tab": "\t",
            "other": config.get("customDelimiter", "|")
        }

        delimiter = delimiter_map.get(config.get("delimiter", "comma"), ",")
        encoding = config.get("encoding", "UTF-8")
        has_header = config.get("hasHeader", False)

        # pandas로 CSV 읽기
        df = pd.read_csv(
            file_io,
            delimiter=delimiter,
            encoding=encoding,
            header=0 if has_header else None
        )

        # 헤더가 없는 경우, 컬럼 이름 할당
        if not has_header:
            # config에서 컬럼 정보가 제공된 경우 사용
            if "columns" in config and len(config["columns"]) == len(df.columns):
                column_names = [col["name"] for col in config["columns"]]
                df.columns = column_names
            else:
                # 제공되지 않은 경우 기본 컬럼명 생성
                df.columns = [f"Column{i + 1}" for i in range(len(df.columns))]

        # 기본 정보
        total_rows = len(df)
        total_columns = len(df.columns)

        # 결측치 분석
        missing_columns = []
        missing_details = {}

        for col in df.columns:
            missing_count = df[col].isna().sum()
            if missing_count > 0:
                missing_percentage = round((missing_count / total_rows) * 100, 2)
                # 결측치가 있는 행의 인덱스 (최대 20개만)
                missing_indices = df[df[col].isna()].index.tolist()[:20]

                missing_columns.append(col)
                missing_details[col] = {
                    "count": int(missing_count),
                    "percentage": missing_percentage,
                    "rowIndices": missing_indices
                }

        # 데이터 샘플 (처음 몇 개 행만)
        sample_size = min(2, total_rows)  # 여기서는 예시로 2개만 표시
        data_sample = {
            "columns": df.columns.tolist(),
            "data": df.head(sample_size).to_dict(orient="records")
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


async def create_pipeline_document(project_id: int, member_id: int, etag: str) -> Any:
    """
    MongoDB에 파이프라인 문서 생성

    Args:
        project_id: 프로젝트 ID
        member_id: 회원 ID
        etag: 원본 데이터셋 ETag

    Returns:
        ObjectId: 생성된 파이프라인 문서의 ID
    """
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
            "original_dataset_etag": etag,
            "history": []
        }

        # MongoDB에 삽입
        result = await pipeline_collection.insert_one(pipeline_doc)

        return result.inserted_id

    except Exception as e:
        logger.error(f"파이프라인 문서 생성 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"파이프라인 문서 생성 중 오류: {str(e)}")