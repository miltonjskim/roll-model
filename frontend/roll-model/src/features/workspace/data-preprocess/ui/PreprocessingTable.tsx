'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAtomValue } from 'jotai';
import { uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { OriginalDatasetType } from '@/entities/workspace/data-config/model/types';

interface PreprocessingTableProps {
  changedCells?: Record<string, boolean>; // 예: { '2:temperature': true }
}

const PreprocessingTable = ({ changedCells }: PreprocessingTableProps) => {
  const uploaded = useAtomValue(uploadedDatasetAtom);
  const dataset: OriginalDatasetType | null = uploaded?.originalDatasets ?? null;

  console.log('changedCells:', changedCells);
  console.log('dataset:', dataset);

  if (!dataset || dataset.columns.length === 0 || dataset.data.length === 0) {
    return <p className="mt-2 text-sm text-gray-500">표시할 데이터가 없습니다.</p>;
  }

  return (
    <div className="relative mt-4 max-h-80 overflow-x-auto overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-[theme(primary-white)] sticky top-0 z-10">
            <TableHead>행</TableHead>
            {dataset.columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataset.data.map((row, rowIdx) => {
            const rowKey = row.idx ?? rowIdx;

            return (
              <TableRow key={String(rowKey)}>
                <TableCell className="text-xs text-gray-500">{rowKey}</TableCell>
                {dataset.columns.map((col) => {
                  const cellKey = `${rowKey}:${col}`;
                  const isChanged = changedCells?.[cellKey];
                  const value = row[col];

                  return (
                    <TableCell key={col} className={isChanged ? 'bg-yellow-100 font-medium' : ''}>
                      {value !== null && value !== undefined ? String(value) : <span className="text-gray-400">null</span>}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <p className="mt-2 text-xs text-gray-400">총 {dataset.data.length.toLocaleString()}개 행을 표시 중</p>
    </div>
  );
};

export default PreprocessingTable;
