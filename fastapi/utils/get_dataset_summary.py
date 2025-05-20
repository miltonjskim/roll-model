from pandas import DataFrame

def get_dataset_summary(df: DataFrame):
    """데이터셋 요약 정보 생성"""
    # 데이터셋 요약 정보 생성 로직
    # 예시: 데이터셋의 컬럼 수, 행 수, 결측치 비율 등

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
                "rowIndices": missing_indices,
            }

    return {
        "total_rows": total_rows,
        "total_columns": total_columns,
        "missing_values": {"columns": missing_columns, "details": missing_details},
    }
