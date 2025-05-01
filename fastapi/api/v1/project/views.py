"""
프로젝트 데이터셋 관리 API 라우터
: 프로젝트의 원본 데이터셋 업로드 및 관리를 위한 REST API 엔드포인트 제공

주요 기능:
- 데이터셋 파일 업로드 및 저장
- 업로드된 데이터셋 분석 및 요약 정보 제공
- MinIO에 파일 저장 및 MySQL에 ETag 저장
- MongoDB 파이프라인 생성

파이프라인의 시작점
 -> 업로드된 데이터셋을 분석하고 추후 전처리 작업의 기반이 되는 정보 제공
"""

from fastapi import APIRouter, Depends, File, Form, UploadFile, Path
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import logging
import json

from db.mysql_config import get_mysql_db
from core.api_response import ApiResponse
from service.dataset_service import upload_dataset_and_save_metadata
from schemas.mysql.project import Project

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/dataset", response_class=ApiResponse)
async def upload_project_dataset(
    project_id: int = Path(..., title="프로젝트 ID"),
    config: str = Form(..., description="데이터셋 설정 JSON"),
    dataFile: UploadFile = File(..., description="CSV 파일"),
    db: Session = Depends(get_mysql_db)
):
    """
    프로젝트에 원본 데이터셋 업로드

    - **project_id**: 데이터셋을 업로드할 프로젝트 ID
    - **config**: 데이터셋 설정 (JSON 문자열)
      - delimiter: 구분자 타입 (comma, semicolon, tab, other)
      - encoding: 파일 인코딩 (UTF-8, CP949 등)
      - hasHeader: 헤더 존재 여부
      - columns: 컬럼 정보 배열
    - **dataFile**: 업로드할 CSV 파일

    파일 MinIO에 저장 -> ETag MySQL에 저장 -> 데이터셋 분석 정보 반환
    """
    try:
        # 설정 유효성 검사
        try:
            config_data = json.loads(config)
            # 필수 필드 확인
            if "delimiter" not in config_data:
                return ApiResponse(
                    status_code=400,
                    error_code="INVALID_CONFIG",
                    error_message="delimiter 필드가 필요합니다"
                )
        except json.JSONDecodeError:
            return ApiResponse(
                status_code=400,
                error_code="INVALID_JSON",
                error_message="JSON 형식이 올바르지 않습니다"
            )

        # 파일 유효성 검사
        if not dataFile.content_type or not dataFile.content_type.endswith(('csv', 'text/csv', 'application/csv')):
            return ApiResponse(
                status_code=400,
                error_code="INVALID_FILE_TYPE",
                error_message="CSV 파일만 업로드 가능합니다"
            )

        # 프로젝트 존재 여부 및 소유자 확인
        project = db.query(Project).filter(
            Project.project_id == project_id,
            Project.deleted_yn == False
        ).first()

        if not project:
            return ApiResponse(
                status_code=404,
                error_code="PROJECT_NOT_FOUND",
                error_message="프로젝트를 찾을 수 없습니다"
            )

        member_id = project.member_id

        # 데이터셋 업로드 및 분석
        result = await upload_dataset_and_save_metadata(
            db=db,
            project_id=project_id,
            member_id=member_id,
            file=dataFile,
            config_json=config
        )

        # 응답 구성
        return ApiResponse(
            data=result,
            message="데이터 업로드 및 분석 완료",
            status_code=200
        )

    except Exception as e:
        logger.error(f"데이터셋 업로드 중 오류: {str(e)}")
        return ApiResponse(
            status_code=500,
            error_code="UPLOAD_ERROR",
            error_message=f"데이터셋 업로드 중 오류가 발생했습니다: {str(e)}"
        )