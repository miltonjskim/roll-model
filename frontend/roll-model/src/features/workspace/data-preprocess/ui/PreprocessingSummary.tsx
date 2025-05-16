'use client';

import { useAtomValue } from 'jotai';
import { uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PreprocessingSummary = () => {
  const uploadedData = useAtomValue(uploadedDatasetAtom);
  const [showModal, setShowModal] = useState(false);

  const summary = useMemo(() => {
    if (!uploadedData) return null;

    const { totalRows, totalColumns } = uploadedData.summary;
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
    <>
      <div className="mt-2 text-sm">
        <div className="flex justify-between text-sm text-[var(--primary-black)]">
          <p>
            <span className="font-tossface mr-1">📊</span>총 {summary.rowCount.toLocaleString()}행 · {summary.columnCount}열
          </p>
          <button onClick={() => setShowModal(true)} className="text-[var(--color-blue-01)] hover:underline">
            <span className="font-tossface mr-1">🧩</span>결측 컬럼 {summary.missingColumnNames.length}개
          </button>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[theme(primary-white)] max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <span className="font-tossface mr-1">🧩</span>결측 컬럼 상세 정보
            </DialogTitle>
          </DialogHeader>

          {summary.missingColumnNames.length === 0 ? (
            <p className="mt-4 text-center text-sm text-gray-500">결측 컬럼이 없습니다.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {[...summary.missingColumnNames]
                .sort((a, b) => summary.missingDetails[b].percentage - summary.missingDetails[a].percentage)
                .map((col) => {
                  const detail = summary.missingDetails[col];
                  const shownIndices = detail.rowIndices.slice(0, 30);
                  const hiddenCount = detail.rowIndices.length - shownIndices.length;

                  return (
                    <li key={col} className="rounded-md border border-[var(--color-gray-03)] p-4">
                      <p className="mb-1 text-sm font-semibold text-[var(--primary-black)]">{col}</p>
                      <p className="mb-2 text-sm text-[var(--color-blue-01)]">
                        총 {detail.count}개 ({detail.percentage}%)
                      </p>
                      <div className="max-h-20 overflow-y-auto rounded-md border border-[var(--color-gray-04)] bg-[var(--color-gray-05)] p-2 text-xs text-gray-600">
                        <p className="mb-1 font-medium text-[var(--color-gray-01)]">결측치가 발생한 행 번호</p>
                        <p className="leading-relaxed break-all">
                          {shownIndices.join(', ')}
                          {hiddenCount > 0 && ` ... 외 ${hiddenCount}개`}
                        </p>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreprocessingSummary;
