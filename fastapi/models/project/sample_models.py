# schemas/sample_datasets.py
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from enum import Enum
import pandas as pd


class SampleDatasetType(Enum):
    """샘플 데이터셋 타입"""
    IRIS = 1
    SALES_DATA = 2
    CUSTOMER_DATA = 3
    TITANIC = 4
    BOSTON_HOUSING = 5
    STOCK_PRICES = 6


@dataclass
class SampleDatasetConfig:
    """샘플 데이터셋 설정"""
    id: int
    name: str
    description: str
    category: str
    domain: str
    columns: List[Dict[str, str]]
    data: List[Dict[str, Any]]
    encoding: str = "UTF-8"
    delimiter: str = "comma"
    has_header: bool = True

    def to_csv_bytes(self) -> bytes:
        """샘플 데이터를 CSV bytes로 변환"""
        # 데이터를 DataFrame으로 변환
        df = pd.DataFrame(self.data)

        # 컬럼 순서 맞추기
        column_names = [col["name"] for col in self.columns]
        df = df[column_names]

        # CSV 형태의 문자열로 변환
        csv_string = df.to_csv(index=False, encoding=self.encoding)

        # bytes로 변환
        return csv_string.encode(self.encoding)

    def get_config_dict(self) -> Dict[str, Any]:
        """데이터셋 설정 딕셔너리 반환"""
        return {
            "delimiter": self.delimiter,
            "encoding": self.encoding,
            "hasHeader": self.has_header,
            "columns": self.columns
        }

    def get_filename(self) -> str:
        """파일명 생성"""
        return f"{self.name}_{self.id}.csv"


# 미리 정의된 샘플 데이터셋들
SAMPLE_DATASETS = {
    SampleDatasetType.IRIS.value: SampleDatasetConfig(
        id=1,
        name="Iris 데이터셋",
        description="꽃의 종류를 분류하는 클래식한 머신러닝 데이터셋",
        category="REGRESSION",
        domain="GENERAL",
        columns=[
            {"name": "sepal_length", "type": "double"},
            {"name": "sepal_width", "type": "double"},
            {"name": "petal_length", "type": "double"},
            {"name": "petal_width", "type": "double"},
            {"name": "species", "type": "string"}
        ],
        data=[
            {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "species": "setosa"},
            {"sepal_length": 4.9, "sepal_width": 3.0, "petal_length": 1.4, "petal_width": 0.2, "species": "setosa"},
            {"sepal_length": 4.7, "sepal_width": 3.2, "petal_length": 1.3, "petal_width": 0.2, "species": "setosa"},
            {"sepal_length": 4.6, "sepal_width": 3.1, "petal_length": 1.5, "petal_width": 0.2, "species": "setosa"},
            {"sepal_length": 5.0, "sepal_width": 3.6, "petal_length": 1.4, "petal_width": 0.2, "species": "setosa"},
            {"sepal_length": 7.0, "sepal_width": 3.2, "petal_length": 4.7, "petal_width": 1.4, "species": "versicolor"},
            {"sepal_length": 6.4, "sepal_width": 3.2, "petal_length": 4.5, "petal_width": 1.5, "species": "versicolor"},
            {"sepal_length": 6.9, "sepal_width": 3.1, "petal_length": 4.9, "petal_width": 1.5, "species": "versicolor"},
            {"sepal_length": 5.5, "sepal_width": 2.3, "petal_length": 4.0, "petal_width": 1.3, "species": "versicolor"},
            {"sepal_length": 6.5, "sepal_width": 2.8, "petal_length": 4.6, "petal_width": 1.5, "species": "versicolor"},
            {"sepal_length": 6.3, "sepal_width": 3.3, "petal_length": 6.0, "petal_width": 2.5, "species": "virginica"},
            {"sepal_length": 5.8, "sepal_width": 2.7, "petal_length": 5.1, "petal_width": 1.9, "species": "virginica"},
            {"sepal_length": 7.1, "sepal_width": 3.0, "petal_length": 5.9, "petal_width": 2.1, "species": "virginica"},
            {"sepal_length": 6.3, "sepal_width": 2.9, "petal_length": 5.6, "petal_width": 1.8, "species": "virginica"},
            {"sepal_length": 6.5, "sepal_width": 3.0, "petal_length": 5.8, "petal_width": 2.2, "species": "virginica"}
        ]
    ),

    SampleDatasetType.SALES_DATA.value: SampleDatasetConfig(
        id=2,
        name="판매 데이터",
        description="상품별 판매량과 매출 분석 데이터",
        category="CLASSIFICATION",
        domain="RETAIL",
        columns=[
            {"name": "product_id", "type": "string"},
            {"name": "product_name", "type": "string"},
            {"name": "category", "type": "string"},
            {"name": "quantity_sold", "type": "integer"},
            {"name": "unit_price", "type": "double"},
            {"name": "revenue", "type": "double"},
            {"name": "sales_date", "type": "datetime"}
        ],
        data=[
            {"product_id": "P001", "product_name": "스마트폰", "category": "전자기기", "quantity_sold": 150,
             "unit_price": 800000, "revenue": 120000000, "sales_date": "2024-01-15"},
            {"product_id": "P002", "product_name": "노트북", "category": "전자기기", "quantity_sold": 80,
             "unit_price": 1500000, "revenue": 120000000, "sales_date": "2024-01-16"},
            {"product_id": "P003", "product_name": "이어폰", "category": "전자기기", "quantity_sold": 300,
             "unit_price": 200000, "revenue": 60000000, "sales_date": "2024-01-17"},
            {"product_id": "P004", "product_name": "운동화", "category": "신발", "quantity_sold": 200, "unit_price": 150000,
             "revenue": 30000000, "sales_date": "2024-01-18"},
            {"product_id": "P005", "product_name": "등산복", "category": "의류", "quantity_sold": 120, "unit_price": 300000,
             "revenue": 36000000, "sales_date": "2024-01-19"},
            {"product_id": "P006", "product_name": "커피머신", "category": "가전", "quantity_sold": 50, "unit_price": 500000,
             "revenue": 25000000, "sales_date": "2024-01-20"},
            {"product_id": "P007", "product_name": "블렌더", "category": "가전", "quantity_sold": 70, "unit_price": 200000,
             "revenue": 14000000, "sales_date": "2024-01-21"},
            {"product_id": "P008", "product_name": "책상", "category": "가구", "quantity_sold": 40, "unit_price": 400000,
             "revenue": 16000000, "sales_date": "2024-01-22"},
            {"product_id": "P009", "product_name": "의자", "category": "가구", "quantity_sold": 60, "unit_price": 250000,
             "revenue": 15000000, "sales_date": "2024-01-23"},
            {"product_id": "P010", "product_name": "헤드폰", "category": "전자기기", "quantity_sold": 180,
             "unit_price": 300000, "revenue": 54000000, "sales_date": "2024-01-24"}
        ]
    ),

    SampleDatasetType.CUSTOMER_DATA.value: SampleDatasetConfig(
        id=3,
        name="고객 데이터",
        description="고객 프로필 및 구매 패턴 분석 데이터",
        category="CLASSIFICATION",
        domain="MARKETING",
        columns=[
            {"name": "customer_id", "type": "string"},
            {"name": "age", "type": "integer"},
            {"name": "gender", "type": "string"},
            {"name": "city", "type": "string"},
            {"name": "total_purchases", "type": "integer"},
            {"name": "avg_purchase_value", "type": "double"},
            {"name": "last_purchase_date", "type": "datetime"},
            {"name": "membership_level", "type": "string"}
        ],
        data=[
            {"customer_id": "C001", "age": 28, "gender": "여성", "city": "서울", "total_purchases": 15,
             "avg_purchase_value": 450000, "last_purchase_date": "2024-01-20", "membership_level": "Gold"},
            {"customer_id": "C002", "age": 35, "gender": "남성", "city": "부산", "total_purchases": 8,
             "avg_purchase_value": 320000, "last_purchase_date": "2024-01-18", "membership_level": "Silver"},
            {"customer_id": "C003", "age": 42, "gender": "여성", "city": "대구", "total_purchases": 22,
             "avg_purchase_value": 680000, "last_purchase_date": "2024-01-22", "membership_level": "Platinum"},
            {"customer_id": "C004", "age": 29, "gender": "남성", "city": "인천", "total_purchases": 5,
             "avg_purchase_value": 180000, "last_purchase_date": "2024-01-15", "membership_level": "Bronze"},
            {"customer_id": "C005", "age": 38, "gender": "여성", "city": "서울", "total_purchases": 18,
             "avg_purchase_value": 520000, "last_purchase_date": "2024-01-25", "membership_level": "Gold"},
            {"customer_id": "C006", "age": 31, "gender": "남성", "city": "광주", "total_purchases": 12,
             "avg_purchase_value": 380000, "last_purchase_date": "2024-01-19", "membership_level": "Silver"},
            {"customer_id": "C007", "age": 45, "gender": "여성", "city": "대전", "total_purchases": 25,
             "avg_purchase_value": 750000, "last_purchase_date": "2024-01-23", "membership_level": "Platinum"},
            {"customer_id": "C008", "age": 26, "gender": "남성", "city": "울산", "total_purchases": 7,
             "avg_purchase_value": 250000, "last_purchase_date": "2024-01-16", "membership_level": "Bronze"},
            {"customer_id": "C009", "age": 39, "gender": "여성", "city": "수원", "total_purchases": 20,
             "avg_purchase_value": 580000, "last_purchase_date": "2024-01-24", "membership_level": "Gold"},
            {"customer_id": "C010", "age": 33, "gender": "남성", "city": "청주", "total_purchases": 10,
             "avg_purchase_value": 420000, "last_purchase_date": "2024-01-21", "membership_level": "Silver"}
        ]
    )
}


def get_sample_dataset(dataset_id: int) -> Optional[SampleDatasetConfig]:
    """샘플 데이터셋 조회"""
    return SAMPLE_DATASETS.get(dataset_id)


def get_all_sample_datasets() -> Dict[int, SampleDatasetConfig]:
    """모든 샘플 데이터셋 조회"""
    return SAMPLE_DATASETS