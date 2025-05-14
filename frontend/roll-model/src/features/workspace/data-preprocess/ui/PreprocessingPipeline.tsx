'use client';

import { Step } from '@/entities/workspace/data-preprocess/model/types';
import { useEffect, useRef, useState } from 'react';

const getStepLabel = (type: string) => {
  switch (type) {
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

const getStepSubLabel = (step: Step) => {
  const { columnId, method, detection, targetColumn, offset, samplingRatio } = step.parameters || {};

  if (step.type === 'MISSING-VALUES') {
    return `처리한 컬럼: ${columnId} → ${method}`;
  }
  if (step.type === 'OUTLIER-DETECTION') {
    return `컬럼: ${columnId} → ${detection}`;
  }
  if (step.type === 'OUTLIER-HANDLE') {
    return `컬럼: ${columnId} → ${method}`;
  }
  if (step.type === 'DATA-TRANSFORMATION') {
    return `컬럼: ${columnId}${offset !== undefined ? ` (offset=${offset})` : ''}`;
  }
  if (step.type === 'ENCODING') {
    return `컬럼: ${columnId}${targetColumn ? ` / target=${targetColumn}` : ''}`;
  }
  if (step.type === 'CLASS-BALANCING') {
    return `컬럼: ${columnId} → ${method} (비율: ${samplingRatio}%)`;
  }
  return JSON.stringify(step.parameters);
};

interface PreprocessPipelineProps {
  steps: Step[];
}

const PreprocessingPipeline = ({ steps }: PreprocessPipelineProps) => {
  console.log('steps:', steps);
  const lastStepRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lastStepRef.current) {
      lastStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [steps.length]); // step이 추가될 때마다 실행

  return (
    <div className="mt-4">
      <div className="flex min-h-[8rem] flex-1 flex-wrap overflow-x-auto rounded-md border border-gray-300 p-2">
        {steps.length === 0 ? (
          <p className="text-sm text-gray-500">적용된 전처리 단계가 없습니다.</p>
        ) : (
          <div className="flex flex-nowrap gap-2">
            {steps.map((step, idx) => (
              <div key={idx} ref={idx === steps.length - 1 ? lastStepRef : null} className="h-[9rem] w-[16rem] shrink-0 rounded-md border border-gray-200 px-4 py-2">
                <p className="text-sm font-semibold">{getStepLabel(step.type)}</p>

                <p className="mb-1 text-xs font-medium">{step.optionName}</p>
                <p className="text-xs text-gray-600">{getStepSubLabel(step)}</p>
                {step.type === 'OUTLIER-DETECTION' && (
                  <div>
                    <div className="mt-1 text-xs font-medium">
                      <p>상한 이상치 임계값: {step.parameters.maxThreshold}</p>
                      <p>하한 이상치 임계값: {step.parameters.minThreshold}</p>
                    </div>
                    <div className="mt-1 text-xs font-medium">
                      {Array.isArray(step.parameters.outlierIndices) && (
                        <p>
                          이상치가 있는 행: {step.parameters.outlierIndices.slice(0, 5).join(', ')}
                          {step.parameters.outlierIndices.length > 5 && '...'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {step.type === 'MISSING-VALUES' && (
                  <div className="mt-1 text-xs font-medium">
                    <p>결측치 대체 값: {step.parameters.fillValue}</p>
                  </div>
                )}

                {step.type === 'OUTLIER-HANDLE' && (
                  <div>
                    <p></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreprocessingPipeline;
