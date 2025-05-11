'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export interface Step {
  type: string;
  parameters: Record<string, any>;
  order: number;
  active: boolean;
}

const getStepLabel = (type: string) => {
  switch (type) {
    case 'MISSING_VALUE':
      return '결측치 처리';
    case 'OUTLIER_DETECTION':
      return '이상치 탐지';
    case 'NORMALIZATION':
      return '정규화';
    case 'ENCODING':
      return '인코딩';
    case 'CLASS_BALANCING':
      return '클래스 불균형 처리';
    case 'TRANSFORMATION':
      return '데이터 변환';
    default:
      return '기타';
  }
};

const getStepSubLabel = (step: Step) => {
  const { column, method, detection, targetColumn, offset, samplingRatio } = step.parameters || {};

  if (step.type === 'MISSING_VALUE') {
    return `${column} → ${method}`;
  }
  if (step.type === 'OUTLIER_DETECTION') {
    return `${column} → ${detection}`;
  }
  if (step.type === 'TRANSFORMATION') {
    return `${column}${offset !== undefined ? ` (offset=${offset})` : ''}`;
  }
  if (step.type === 'ENCODING') {
    return `${column}${targetColumn ? ` / target=${targetColumn}` : ''}`;
  }
  if (step.type === 'CLASS_BALANCING') {
    return `${column} → ${method} (비율: ${samplingRatio}%)`;
  }
  return JSON.stringify(step.parameters);
};

interface Props {
  onAdd: () => void;
  recommendedSteps?: Step[];
}

const PreprocessingPipeline = ({ onAdd, recommendedSteps }: Props) => {
  const [steps, setSteps] = useState<Step[]>(recommendedSteps || []);

  useEffect(() => {
    if (recommendedSteps) {
      setSteps(recommendedSteps);
    }
  }, [recommendedSteps]);

  return (
    <div className="mt-4 flex items-start gap-2">
      <div className="min-h-[8rem] flex-1 rounded-md border border-gray-300 p-4">
        {steps.length === 0 ? (
          <p className="text-sm text-gray-500">적용된 전처리 단계가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {steps.map((step, idx) => (
              <div key={idx} className="inline-block rounded-md border border-gray-200 px-4 py-2">
                <p className="text-sm font-semibold">{getStepLabel(step.type)}</p>
                <p className="text-xs text-gray-600">{getStepSubLabel(step)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="black" size="sm" className="w-[5rem]" onClick={onAdd}>
          + 추가
        </Button>
        <Button variant="outline" size="sm" className="w-[5rem]">
          - 삭제
        </Button>
      </div>
    </div>
  );
};

export default PreprocessingPipeline;
