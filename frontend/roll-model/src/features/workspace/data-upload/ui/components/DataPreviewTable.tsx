'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DataPreviewTableProps = {
  header: string[];
  previewRow: string[];
  columnTypes: string[];
  editableHeaderIndex: number | null;
  useHeaderRow: boolean;
  onHeaderEdit: (idx: number, value: string) => void;
  onHeaderEditComplete: (idx: number, value: string) => void;
  onTypeChange: (idx: number, value: string) => void;
  setEditableHeaderIndex: (idx: number | null) => void;
};

export const DataPreviewTable = ({ header, previewRow, columnTypes, editableHeaderIndex, onHeaderEdit, onHeaderEditComplete, onTypeChange, setEditableHeaderIndex }: DataPreviewTableProps) => (
  <Table className="rounded border">
    <TableHeader>
      <TableRow>
        <TableHead className="bg-[theme(color-gray-05)] border-r">헤더</TableHead>
        {header.map((col, idx) => (
          <TableHead key={idx} className="bg-[theme(color-gray-05)] border-r">
            {editableHeaderIndex === idx ? (
              <Input
                autoFocus
                value={col}
                onChange={(e) => onHeaderEdit(idx, e.target.value)}
                onBlur={(e) => onHeaderEditComplete(idx, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onHeaderEditComplete(idx, (e.target as HTMLInputElement).value)}
                className="bg-[theme(primary-white)] w-full"
              />
            ) : (
              <span onClick={() => setEditableHeaderIndex(idx)} className="cursor-pointer">
                {col || `컬럼 ${idx + 1}`}
              </span>
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="border-r">값</TableCell>
        {previewRow.map((val, idx) => (
          <TableCell key={idx} className="border-r">
            {val}
          </TableCell>
        ))}
      </TableRow>
      <TableRow>
        <TableCell className="border-r">타입</TableCell>
        {columnTypes.map((type, idx) => (
          <TableCell key={idx} className="border-r">
            <Select value={type} onValueChange={(v) => onTypeChange(idx, v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">string</SelectItem>
                <SelectItem value="integer">integer</SelectItem>
                <SelectItem value="double">double</SelectItem>
                <SelectItem value="boolean">boolean</SelectItem>
                <SelectItem value="date">date</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
        ))}
      </TableRow>
    </TableBody>
  </Table>
);
