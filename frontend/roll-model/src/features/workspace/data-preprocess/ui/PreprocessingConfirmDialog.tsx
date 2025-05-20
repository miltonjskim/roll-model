'use client';

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Step } from '@/entities/workspace/data-preprocess/model/types';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import clsx from 'clsx';
import SectionCard from '@/features/workspace/data-preprocess/ui/SectionCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PreprocessingConfirmDialogProps {
  steps: Step[];
  requestPreprocessing: () => void;
}

const sections = [
  {
    title: '결측치 처리',
    items: ['평균값으로 대체', '중앙값으로 대체', '최빈값으로 대체', '결측치가 있는 행 제거'],
    icon: '❓',
  },
  {
    title: '이상치 탐지',
    items: ['Z-점수 기반 탐지', 'IQR 기반 탐지'],
    icon: '🔍',
  },
  {
    title: '이상치 처리',
    items: ['평균값으로 대체', '중앙값으로 대체', '최빈값으로 대체', '이상치가 있는 행 제거'],
    icon: '🛠️',
  },
  {
    title: '데이터 정규화',
    items: ['Z-점수 정규화', 'Min-Max 정규화', '로그 변환', '제곱근 변환'],
    icon: '🔁',
  },
  {
    title: '인코딩',
    items: ['원핫 인코딩', '레이블 인코딩', '타겟 인코딩'],
    icon: '🧮',
  },
  {
    title: '클래스 불균형 처리',
    items: [],
    icon: '⚖️',
  },
  {
    title: '특정 컬럼 삭제/유지',
    items: [],
    icon: '🪄',
  },
];

const typeMapping: Record<string, string> = {
  // categoryId → API type
  missing_values: 'MISSING_VALUE_IMPUTATION', // 결측치 대체
  outlier_detection: 'OUTLIER_DETECTION',
  outlier_handle: 'OUTLIER_IMPUTATION', // or REMOVE
  data_transformation: 'Z_SCORE_SCALING', // etc.
  encoding: 'ONEHOT_ENCODING', // etc.
  class_balancing: 'CLASS_BALANCING',
  col_handle: 'COLUMN_DROP', // or COLUMN_KEEP
};
const PreprocessingConfirmDialog = ({ steps, requestPreprocessing }: PreprocessingConfirmDialogProps) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleConfirm = () => {
    requestPreprocessing();
    setOpen(false);
  };

  console.log('한번에 전처리할 steps:', steps);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          이대로 전처리하기
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">AI 추천 전처리 단계 안내</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">아래 단계들이 순차적으로 실행됩니다.</DialogDescription>
        </DialogHeader>

        <Collapsible open={expanded} onOpenChange={setExpanded} className="mt-3">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="text-muted-foreground flex w-full items-center gap-1 text-sm">
              가능한 전처리 단계 확인하기
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-4 rounded-lg border border-[var(--color-gray-04)] p-4 transition-all">
            <div className="grid grid-cols-2 gap-4">
              {sections
                .filter((s) => s.items.length > 0)
                .map((section) => (
                  <SectionCard key={section.title} section={section} />
                ))}

              <div className="flex flex-col gap-4">
                {sections
                  .filter((s) => s.items.length === 0)
                  .map((section) => (
                    <SectionCard key={section.title} section={section} />
                  ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-3 space-y-4 overflow-y-auto pr-2">
          <div className="bg-[theme(--color-gray-05)] text-muted-foreground mt-6 space-y-2 rounded-md border border-[var(--color-gray-03)] px-3 py-4 text-sm">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 text-[var(--color-gray-01)]" />
              <p>
                <b className="text-foreground">파이프라인은 순차적으로 실행</b>됩니다. 이전 단계의 출력 데이터는 다음 단계의 입력으로 사용됩니다.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--color-gray-01)]" />
              <p>모든 단계 완료 시, 최종 데이터셋이 저장됩니다.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-red-500" />
              <p>
                중간에 <span className="text-destructive font-semibold">오류가 발생하면</span>, 오류 발생 이전 단계까지만 적용됩니다.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mx-auto mt-4">
          <Button variant="black" onClick={handleConfirm}>
            전처리 시작
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreprocessingConfirmDialog;
