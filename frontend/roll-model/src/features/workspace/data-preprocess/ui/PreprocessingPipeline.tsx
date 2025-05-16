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
        className={clsx(
          'rounded-md border border-[var(--color-gray-04)] p-2',
          cardStyle === 'small' ? 'flex max-h-[80%] flex-col items-center gap-3 overflow-y-auto' : 'flex flex-row-reverse flex-nowrap justify-start gap-3 overflow-x-auto',
        )}
      >
        {/* 단계 수 표시 (large일 때만) */}
        {cardStyle === 'large' && steps && steps.length > 0 && <p className="mb-2 w-full text-right text-xs text-gray-400">총 단계: {steps.filter(Boolean).length}단계</p>}

        {cardStyle === 'small' && steps && steps.length > 0 && <p className="mb-2 w-full text-right text-xs text-gray-400">총 단계: {steps.filter(Boolean).length}단계</p>}

        {/* 단계 없음 메시지 */}
        {!steps || steps.filter(Boolean).length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            {cardStyle === 'small' ? (
              <>
                <span className="font-tossface">🤖</span> AI가 추천한 전처리 단계가 없습니다.
              </>
            ) : (
              <>
                <span className="font-tossface">🛠️</span> 아직 적용된 전처리 단계가 없어요.
                <br />
                필요한 기능을 선택해 데이터를 다듬어보세요.
              </>
            )}
          </p>
        ) : (
          (cardStyle === 'large' ? [...steps].filter((step): step is Step => step != null).reverse() : [...steps].filter((step): step is Step => step != null)).map((step, idx, arr) => (
            <div
              key={idx}
              ref={cardStyle === 'large' && idx === 0 ? lastStepRef : null}
              className={clsx(cardBaseClass, cardStyle === 'large' && idx === 0 && 'ring-2 ring-[var(--color-blue-01)] ring-offset-1')}
            >
              <p className="mb-1 text-sm font-bold text-[var(--color-blue-01)]">
                {cardStyle === 'large' ? arr.length - idx : idx + 1}. {getStepLabel(step.type)}
              </p>
              <p className="line-clamp-1 text-sm font-semibold text-gray-800" title={step.optionName}>
                {step.optionName}
              </p>
              <p className="mb-2 line-clamp-2 text-xs font-semibold text-gray-500" title={getStepSubLabel(step)}>
                {getStepSubLabel(step)}
              </p>

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
          ))
        )}
      </div>
    </div>
  );
};

export default PreprocessingPipeline;
