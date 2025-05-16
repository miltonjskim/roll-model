'use client';

import { Step } from '@/entities/workspace/data-preprocess/model/types';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

const methodLabelMap: Record<string, string> = {
  MEAN: '평균값 대체',
  MEDIAN: '중앙값 대체',
  MODE: '최빈값 대체',
  ROW_REMOVE: '행 제거',
  COL_REMOVE: '열 제거',
  ZSCORE: 'Z-점수 탐지',
  IQR: 'IQR 탐지',
  OVER: '오버샘플링',
  UNDER: '언더샘플링',
};

const getStepLabel = (type: string) => {
  switch (type.toUpperCase()) {
    case 'MISSING-VALUES':
      return '결측치 처리';
    case 'OUTLIER-DETECTION':
      return '이상치 탐지';
    case 'OUTLIER-HANDLE':
      return '이상치 처리';
    case 'DATA-TRANSFORMATION':
      return '데이터 정규화 및 변환';
    case 'ENCODING':
      return '인코딩';
    case 'CLASS-BALANCING':
      return '클래스 불균형 처리';
    default:
      return '기타';
  }
};

const getStepSubLabel = (step: Step): string => {
  const { columnId, method, detection, targetColumn, offset, samplingRatio, fillValue, maxThreshold, minThreshold } = step.parameters || {};

  const colText = columnId ? `컬럼: ${columnId}` : '';
  const methodText = typeof method === 'string' ? ` → ${methodLabelMap[method] || method}` : '';
  const detectionText = typeof detection === 'string' ? ` → ${methodLabelMap[detection] || detection}` : '';

  switch (step.type.toUpperCase()) {
    case 'MISSING-VALUES':
      return `${colText}${methodText}`;

    case 'OUTLIER-DETECTION': {
      const thresholdText = maxThreshold !== undefined || minThreshold !== undefined ? ` (임계값: ${minThreshold ?? '-'} ~ ${maxThreshold ?? '-'})` : '';
      return `${colText}${detectionText}${thresholdText}`;
    }

    case 'OUTLIER-HANDLE':
      return `${colText}${methodText}`;

    case 'DATA-TRANSFORMATION':
      return `${colText}${offset !== undefined ? ` (오프셋: ${offset})` : ''}`;

    case 'ENCODING':
      return `${colText}${targetColumn ? ` / 타겟: ${targetColumn}` : ''}`;

    case 'CLASS-BALANCING':
      return `${colText}${methodText}${samplingRatio ? ` (비율: ${samplingRatio}%)` : ''}`;

    default:
      return Object.entries(step.parameters ?? {})
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
  }
};

interface PreprocessPipelineProps {
  steps: Step[];
  cardStyle?: 'small' | 'large';
  highlight?: 'blue' | 'gray' | 'none';
}

const PreprocessingPipeline = ({ steps, cardStyle = 'large', highlight = 'none' }: PreprocessPipelineProps) => {
  console.log('steps:', steps);
  const lastStepRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lastStepRef.current) {
      lastStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [steps.length]); // step이 추가될 때마다 실행

  const cardBaseClass = clsx(
    'shrink-0 rounded-lg border p-3 shadow-sm transition hover:shadow-md',
    cardStyle === 'small' && 'w-[13rem] text-xs p-3',
    cardStyle === 'large' && 'w-[16rem] text-sm p-4',
    highlight === 'blue' && 'border-[var(--color-blue-02)]',
    highlight === 'gray' && 'bg-[var(--color-gray-00)] border-gray-300',
    highlight === 'none' && 'bg-[theme(primary-white)] border-[var(--color-gray-04)]',
  );

  return (
    <div className="mt-4">
      <div
        className={clsx('rounded-md border border-[var(--color-gray-04)] p-2', cardStyle === 'small' ? 'flex max-h-[80%] flex-col gap-3 overflow-y-auto' : 'flex flex-nowrap gap-3 overflow-x-auto')}
      >
        {!steps || steps.filter(Boolean).length === 0 ? (
          <p className="text-sm text-gray-500">{cardStyle === 'small' ? 'AI 추천 전처리 단계가 없습니다.' : '적용된 전처리 단계가 없습니다.'}</p>
        ) : (
          steps
            .filter((step): step is Step => step != null)
            .map((step, idx) => {
              return (
                <div
                  key={idx}
                  ref={idx === steps.length - 1 ? lastStepRef : null}
                  className={clsx(cardBaseClass, cardStyle === 'large' && idx === steps.length - 1 && 'ring-2 ring-[var(--color-blue-01)] ring-offset-1')}
                >
                  <p className="mb-1 font-semibold text-[var(--color-blue-01)]">
                    {idx + 1}. {getStepLabel(step.type)}
                  </p>
                  <p className="text-xs font-medium text-gray-800">{step.optionName}</p>
                  <p className="mb-2 text-xs text-gray-500">{getStepSubLabel(step)}</p>

                  <ul className="max-h-24 space-y-0.5 overflow-y-auto pr-1 text-xs text-gray-600">
                    {step.type === 'OUTLIER-DETECTION' && (
                      <>
                        {step.parameters.maxThreshold !== undefined && <li>상한 임계값: {step.parameters.maxThreshold}</li>}
                        {step.parameters.minThreshold !== undefined && <li>하한 임계값: {step.parameters.minThreshold}</li>}
                        {Array.isArray(step.parameters.outlierIndices) && (
                          <li>
                            이상치 행: {step.parameters.outlierIndices.slice(0, 5).join(', ')}
                            {step.parameters.outlierIndices.length > 5 && '...'}
                          </li>
                        )}
                      </>
                    )}
                    {step.type === 'MISSING-VALUES' && step.parameters.fillValue !== undefined && <li>결측치 대체 값: {step.parameters.fillValue}</li>}
                  </ul>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default PreprocessingPipeline;
