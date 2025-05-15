'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { SampleDataset } from '@/entities/workspace/data-selection/model/type';

interface SampleColumnModalProps {
  open: boolean;
  onClose: () => void;
  dataset: SampleDataset | null;
  onSelect: (dataset: SampleDataset) => void;
}

export const SampleColumnModal = ({ open, onClose, dataset, onSelect }: SampleColumnModalProps) => {
  if (!dataset) return null;

  const { name, description, columns, rowCount, columnCount } = dataset;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[theme(primary-white)] max-w-2xl">
        <DialogHeader>
          <DialogTitle>컬럼 미리보기 - {name}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[24rem] overflow-y-auto">
          <table className="w-full table-auto border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">컬럼명</th>
                <th className="border p-2 text-left">타입</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{col.name}</td>
                  <td className="border p-2">{col.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-md border bg-gray-50 px-4 py-3 text-sm text-gray-700">
          총 <span className="font-medium">{columnCount}</span>개의 컬럼, <span className="font-medium">{rowCount}</span>개의 데이터가 포함되어 있어요.
        </div>

        <div className="mt-4 flex justify-center gap-2">
          <Button variant="black" onClick={() => onSelect(dataset)}>
            이 데이터 선택하기
          </Button>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
