'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EncodingSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export const EncodingSelector = ({ value, onChange }: EncodingSelectorProps) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="mt-2 w-[200px]">
      <SelectValue placeholder="인코딩 선택" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="UTF-8">UTF-8</SelectItem>
      <SelectItem value="CP949">CP949</SelectItem>
      <SelectItem value="EUC-KR">EUC-KR</SelectItem>
      <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
      <SelectItem value="UTF-16">UTF-16</SelectItem>
    </SelectContent>
  </Select>
);
