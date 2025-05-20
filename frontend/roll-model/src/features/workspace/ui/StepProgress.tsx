'use client';

import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

const StepProgress = () => {
  const rawPathname = usePathname();
  const pathname = rawPathname.replace(/^\/workspace/, '') || '/';

  const flatSteps = [
    { step: 1, path: '/', label: '프로젝트 시작', icon: '🚀' },
    { step: 2, path: '/data-selection', label: '데이터 선택', icon: '📂' },
    { step: 3, path: '/project-meta', label: '프로젝트 정보 입력', icon: '📝' },
    { step: 3, path: '/retrain', label: '프로젝트 재학습', icon: '🔁' },
    { step: 4, path: '/data-config', label: '데이터 설정', icon: '⚙️' },
    { step: 5, path: '/data-preprocess', label: '전처리', icon: '🧹' },
    { step: 6, path: '/data-preprocess/complete', label: '전처리 완료', icon: '✅' },
    { step: 7, path: '/modeling-section', label: '모델링', icon: '🤖' },
  ];

  // 경로 길이 기준 정렬: 더 긴 경로 먼저 비교
  const sortedSteps = [...flatSteps].sort((a, b) => b.path.length - a.path.length);
  const current = sortedSteps.find((s) => (s.path === '/' ? pathname === '/' : pathname.startsWith(s.path)));

  const currentStep = current?.step ?? 1;
  const currentLabel = current?.label ?? '';

  // step 기준으로 중복 제거
  const dedupedSteps = Array.from(new Map(flatSteps.map((s) => [s.step, s])).values());

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4 px-4 py-2">
      {dedupedSteps.map((step, idx) => {
        const isActive = step.step === currentStep;
        const isCompleted = step.step < currentStep;

        return (
          <Fragment key={step.step}>
            <div className="relative flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 ${
                  isActive ? 'scale-110 bg-black text-white ring-2 ring-black' : isCompleted ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-700'
                }`}
                title={step.label}
              >
                <span className="font-tossface">{step.icon}</span>
              </div>

              <div className={`mt-1 max-w-[6rem] truncate text-center text-xs font-medium ${isActive ? 'text-black' : 'text-gray-400'}`}>{step.label}</div>
            </div>

            {idx < dedupedSteps.length - 1 && <div className={`h-[2px] w-4 transition-colors duration-200 ${isCompleted ? 'bg-gray-800' : 'bg-gray-300'}`} />}
          </Fragment>
        );
      })}
    </div>
  );
};

export default StepProgress;
