'use client';

import { Step } from '@/entities/workspace/data-preprocess/model/types';
import StepDetailModal from '@/features/workspace/data-preprocess/ui/StepDetailModal';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

export const methodLabelMap: Record<string, string> = {
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

export const getStepLabel = (type: string) => {
  switch (type.toUpperCase()) {
    case 'MISSING_VALUES':
      return '결측치 처리';
    case 'OUTLIER_DETECTION':
      return '이상치 탐지';
    case 'OUTLIER_HANDLE':
      return '이상치 처리';
    case 'DATA_TRANSFORMATION':
      return '데이터 정규화';
    case 'ENCODING':
      return '인코딩';
    case 'CLASS_BALANCING':
      return '클래스 불균형 처리';
    case 'COL_HANDLE':
      return '특정 컬럼 삭제/유지';
    case 'COLUMN_MANAGEMENT':
      return '특정 컬럼 삭제/유지';
    default:
      return '기타';
  }
};

const getStepSubLabel = (step: Step): string => {
  const { column, method, detection, targetColumn, offset, samplingRatio, fillValue, maxThreshold, minThreshold, removedColumns } = step.parameters || {};

  const colText = column === 'all_numeric' ? '전체 컬럼' : column ? `컬럼: ${column}` : '';

  const methodText = typeof method === 'string' ? ` → ${methodLabelMap[method] || method}` : '';
  const detectionText = typeof detection === 'string' ? ` → ${methodLabelMap[detection] || detection}` : '';

  switch (step.type.toUpperCase()) {
    case 'MISSING_VALUES':
      return `${colText}${methodText}`;

    case 'OUTLIER_DETECTION': {
      const thresholdText = maxThreshold !== undefined || minThreshold !== undefined ? `<br />(임계값: ${minThreshold ?? '-'} ~ ${maxThreshold ?? '-'})` : '';
      return `${colText}${detectionText}${thresholdText}`;
    }

    case 'OUTLIER_HANDLE':
      return `${colText}${methodText}`;

    case 'DATA_TRANSFORMATION':
      return `${colText}${offset !== undefined ? ` (오프셋: ${offset})` : ''}`;

    case 'ENCODING':
      return `${colText}${targetColumn ? ` / 타겟 컬럼: ${targetColumn}` : ''}`;

    case 'CLASS_BALANCING':
      return `${colText}${methodText}${samplingRatio ? ` (비율: ${samplingRatio}%)` : ''}`;

    case 'COL_HANDLE':
      return `삭제된 컬럼: ${removedColumns}`;
    case 'COLUMN_MANAGEMENT':
      return `삭제된 컬럼: ${removedColumns}`;
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
  // console.log('steps:', steps);
  const lastStepRef = useRef<HTMLDivElement | null>(null);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  useEffect(() => {
    if (lastStepRef.current) {
      lastStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [steps.length]); // step이 추가될 때마다 실행

  const cardBaseClass = clsx(
    'shrink-0 rounded-lg border p-3 shadow-sm transition hover:shadow-md cursor-pointer',
    cardStyle === 'small' && 'w-[80%] text-xs p-3',
    cardStyle === 'large' && 'w-[16rem] text-sm p-4',
    highlight === 'blue' && 'border-[var(--color-blue-02)]',
    highlight === 'gray' && 'bg-[var(--color-gray-00)] border-gray-300',
    highlight === 'none' && 'bg-[theme(primary-white)] border-[var(--color-gray-04)]',
  );

  return (
    <div className="mt-4">
      <div
        className={clsx(
          'w-full rounded-md border border-[var(--color-gray-04)] p-2',
          cardStyle === 'small'
            ? 'flex max-h-[34vh] flex-col items-center gap-3 overflow-y-auto'
            : steps.filter(Boolean).length === 0
              ? 'flex flex-nowrap justify-start gap-3 overflow-x-auto'
              : 'flex w-full flex-row-reverse flex-nowrap justify-start gap-3 overflow-x-auto',
        )}
      >
        {/* 단계 수 표시 */}
        {cardStyle === 'small' && steps.length > 0 && <p className="mb-2 w-full text-right text-xs text-gray-400">총 단계: {steps.filter(Boolean).length}단계</p>}

        {/* 단계 없음 메시지 */}
        {steps.length === 0 ? (
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
          (cardStyle === 'large' ? [...steps].reverse() : [...steps]).map((step, idx, arr) => (
            <StepDetailModal
              key={idx}
              step={step}
              trigger={
                <div
                  ref={cardStyle === 'large' && idx === 0 ? lastStepRef : null}
                  className={clsx(cardBaseClass, cardStyle === 'large' && idx === 0 && 'ring-2 ring-[var(--color-blue-01)] ring-offset-1')}
                >
                  <p className="mb-1 text-sm font-bold text-[var(--color-blue-01)]">
                    {cardStyle === 'large' ? arr.length - idx : idx + 1}. {getStepLabel(step.type)}
                  </p>
                  <p className="line-clamp-1 text-sm font-semibold text-gray-800" title={step.optionName}>
                    {step.optionName}
                  </p>
                  <p className="mb-2 line-clamp-2 text-xs font-semibold text-gray-500" dangerouslySetInnerHTML={{ __html: getStepSubLabel(step) }} />
                </div>
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PreprocessingPipeline;
