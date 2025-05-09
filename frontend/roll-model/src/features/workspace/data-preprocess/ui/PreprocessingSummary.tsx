'use client';

import { useAtomValue } from 'jotai';
import { uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { useMemo } from 'react';

const PreprocessingSummary = () => {
  const uploadedData = useAtomValue(uploadedDatasetAtom);

  const summary = useMemo(() => {
    if (!uploadedData) return null;

    const { totalRows, totalColumns, filename, encoding, delimiter, customDelimiter } = uploadedData.summary;
    const missingColumns = uploadedData.missingValues.columns;
    const details = uploadedData.missingValues.details;

    return {
      rowCount: totalRows,
      columnCount: totalColumns,
      missingColumnNames: missingColumns,
      missingDetails: details,
    };
  }, [uploadedData]);

  if (!summary) {
    return <div className="mt-4 text-sm text-gray-500">데이터를 로드 중입니다...</div>;
  }

  return (
    <div className="mt-4 space-y-0.5 text-sm">
      <div className="flex justify-between">
        <span>총 행 수:</span>
        <span className="font-medium">{summary.rowCount.toLocaleString()}행</span>
      </div>
      <div className="flex justify-between">
        <span>총 열 수:</span>
        <span className="font-medium">{summary.columnCount}열</span>
      </div>
      <div className="flex justify-between">
        <span>결측치가 존재하는 컬럼 수:</span>
        <span className="font-medium text-[var(--color-blue-01)]">{summary.missingColumnNames.length}개</span>
      </div>
      <div>
        <span className="mb-1 block">결측치 컬럼 상세 정보</span>
        <ul className="ml-4 max-h-30 list-disc overflow-y-auto text-[13px]">
          {summary.missingColumnNames.map((col) => {
            const detail = summary.missingDetails[col];
            return (
              <li key={col} className="mb-1">
                <span className="font-semibold">{col}</span> - {detail.count}개 ({detail.percentage}%), 행 번호: [{detail.rowIndices.slice(0, 5).join(', ')}
                {detail.rowIndices.length > 5 ? '...' : ''}]
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PreprocessingSummary;
