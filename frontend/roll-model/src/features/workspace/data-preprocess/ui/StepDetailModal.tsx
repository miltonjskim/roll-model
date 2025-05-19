'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Step } from '@/entities/workspace/data-preprocess/model/types';
import { Sparkles, Info } from 'lucide-react';
import clsx from 'clsx';
import { getStepLabel } from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';

interface StepDetailModalProps {
  step: Step;
  trigger: React.ReactNode;
}

const StepDetailModal = ({ step, trigger }: StepDetailModalProps) => {
  const renderValue = (value: unknown, key: string): string => {
    if (Array.isArray(value)) {
      return `${value.slice(0, 5).join(', ')}${value.length > 5 ? '...' : ''}`;
    }
    if (typeof value === 'boolean') return value ? '✅ 예' : '❌ 아니오';
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const getLabel = (key: string) => {
    const labelMap: Record<string, string> = {
      column: '<span class="font-tossface">📊</span> 컬럼명',
      detection: '<span class="font-tossface">🔍</span> 이상치 탐지 방식',
      method: '<span class="font-tossface">🛠️</span> 처리 방식',
      offset: '<span class="font-tossface">📐</span> 오프셋',
      targetColumn: '<span class="font-tossface">🎯</span> 타겟 컬럼',
      samplingRatio: '<span class="font-tossface">⚖️</span> 샘플링 비율',
      maxThreshold: '<span class="font-tossface">🔺</span> 상한 임계값',
      minThreshold: '<span class="font-tossface">🔻</span> 하한 임계값',
      fillValue: '<span class="font-tossface">🧩</span> 결측치 대체 값',
      outlierIndices: '<span class="font-tossface">📌</span> 변경된 행의 인덱스 목록',
      imputedCount: '<span class="font-tossface">🧮</span> 대체된 값 개수',
      imputedRows: '<span class="font-tossface">🧾</span> 대체된 행',
      missingCount: '<span class="font-tossface">❓</span> 결측치 개수',
      missingIndices: '<span class="font-tossface">📍</span> 결측치 인덱스 목록',
      removeColumns: '<span class="font-tossface">🧹</span> 제거된 컬럼',
      removedCount: '<span class="font-tossface">🗑️</span> 제거된 개수',
      removedRows: '<span class="font-tossface">🗑️</span> 제거된 행',
      statistics_mean: '<span class="font-tossface">📊</span> 평균값',
      statistics_std: '<span class="font-tossface">📉</span> 표준편차',
      transformType: '<span class="font-tossface">🔁</span> 정규화 방식',
      negativeValues: '<span class="font-tossface">🚫</span> 음수 값 포함 여부',
      transformedIndices: '<span class="font-tossface">🌀</span> 변환된 행 인덱스',
      affectedRows: '<span class="font-tossface">🖊️</span> 변경된 행 수',
      categories: '<span class="font-tossface">🏷️</span> 카테고리',
      encodingType: '<span class="font-tossface">🔢</span> 인코딩 타입',
      newColumns: '<span class="font-tossface">🧱</span> 새 컬럼들',
      mapping: '<span class="font-tossface">🗺️</span> 매핑 정보',
      balanceType: '<span class="font-tossface">⚖️</span> 균형화 방법',
      originalDistribution: '<span class="font-tossface">📈</span> 기존 분포',
      newDistribution: '<span class="font-tossface">📉</span> 처리 후 클래스별 샘플 수',
      sampleVariation: '<span class="font-tossface">📊</span> 추가되거나 제거된 샘플 수',
    };

    return labelMap[key] ?? key;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] w-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <span className="text-[1.05rem]">{step.optionName}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1 text-base font-medium text-gray-500">
            <Info className="h-4 w-4 text-gray-400" />
            <span className="font-tossface text-sm text-gray-600">{getStepLabel(step.type)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4 text-sm text-gray-700">
          {Object.entries(step.parameters ?? {}).map(([key, value]) => (
            <div key={key} className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-gray-50 to-white p-3 shadow-sm transition hover:bg-gray-100">
              <div className="w-40 shrink-0 text-right font-semibold text-gray-700" dangerouslySetInnerHTML={{ __html: getLabel(key) }} />
              <div
                className={clsx(
                  'flex-1 break-words whitespace-pre-wrap text-gray-900',
                  (key === 'maxThreshold' || key === 'minThreshold') && 'font-semibold text-red-600',
                  key === 'column' && 'font-bold text-blue-700',
                )}
              >
                {renderValue(value, key)}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="black" className="px-6 py-2 text-sm font-medium">
              닫기
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StepDetailModal;
