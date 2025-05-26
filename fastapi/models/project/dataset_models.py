from pydantic import BaseModel
from typing import List, Dict, Any


class DatasetPageResponse(BaseModel):
    data: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int

# 컬럼 목록 응답 모델
class DatasetColumnsResponse(BaseModel):
    columns: List[str]