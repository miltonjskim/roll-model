'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

type DelimiterSelectorProps = {
  selected: string;
  customValue: string;
  onDelimiterChange: (value: string) => void;
  onCustomChange: (value: string) => void;
};

export const DelimiterSelector = ({ selected, customValue, onDelimiterChange, onCustomChange }: DelimiterSelectorProps) => (
  <RadioGroup value={selected} onValueChange={onDelimiterChange} className="mt-2 space-y-2">
    {[
      { label: '쉼표 (,)', value: ',' },
      { label: '세미콜론 (;)', value: ';' },
      { label: '탭 (\\t)', value: '\t' },
    ].map(({ label, value }) => (
      <div key={value} className="flex items-center gap-2">
        <RadioGroupItem value={value} id={`delimiter-${value}`} />
        <label htmlFor={`delimiter-${value}`} className="text-sm leading-none">
          {label}
        </label>
      </div>
    ))}
    <div className="flex items-center gap-2">
      <RadioGroupItem value="기타 입력" id="delimiter-custom" />
      <label htmlFor="delimiter-custom" className="text-sm leading-none">
        기타 입력
      </label>
      {selected === '기타 입력' && <Input placeholder="구분자를 입력하세요" value={customValue} onChange={(e) => onCustomChange(e.target.value)} className="h-fit w-32" />}
    </div>
  </RadioGroup>
);
