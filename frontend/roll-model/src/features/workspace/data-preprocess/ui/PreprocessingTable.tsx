'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAtomValue } from 'jotai';
import { uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { OriginalDatasetType } from '@/entities/workspace/data-config/model/types';
import clsx from 'clsx';

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

  const dynamicColumns = Array.from(new Set(dataset.data.flatMap((row) => Object.keys(row).filter((key) => key !== 'idx'))));

  // console.log('dynamicColumns:', dynamicColumns);

  return (
    <div className="mt-4 max-h-[80%] overflow-x-auto overflow-y-auto rounded-md border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-[theme(color-gray-04)] sticky top-0 z-10 text-center text-sm font-semibold">행</TableHead>
            {dynamicColumns.map((col) => (
              <TableHead className="bg-[theme(color-gray-04)] sticky top-0 z-10 text-center text-sm font-semibold" key={col}>
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataset.data.map((row, rowIdx) => {
            const rowKey = row.idx ?? rowIdx + 1;

            return (
              <TableRow key={String(rowKey)}>
                <TableCell className="text-xs text-gray-500">{rowKey}</TableCell>
                {dynamicColumns.map((col) => {
                  const cellKey = `${rowKey}:${col}`;
                  const isChanged = changedCells?.[cellKey];
                  const value = row[col];

                  return (
                    <TableCell key={col} className={clsx('text-xs', isChanged && 'border-l-2 border-yellow-300 bg-yellow-50 font-semibold', 'text-center')}>
                      {value !== null && value !== undefined ? String(value) : <span className="text-gray-400">—</span>}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PreprocessingTable;
