// /entities/project-detail/ui/PreprocessingPipelineCard.tsx
import { PreprocessingStep } from '@/entities/project-detail/model/dataTypes';

interface PreprocessingPipelineCardProps {
  steps: PreprocessingStep[];
}

// 전처리 타입별 정보 객체
const preprocessingConfig: Record<string, { icon: string; name: string; ariaLabel: string }> = {
  ORIGINAL_DATA: {
    icon: '📄',
    name: '원본 데이터',
    ariaLabel: '원본 데이터',
  },
  MISSING_VALUE_IMPUTATION: {
    icon: '🧩',
    name: '결측치 대체',
    ariaLabel: '결측치 대체',
  },
  MISSING_VALUE_REMOVE: {
    icon: '🗑️',
    name: '결측치 제거',
    ariaLabel: '결측치 제거',
  },
  OUTLIER_DETECTION: {
    icon: '🔍',
    name: '이상치 탐지',
    ariaLabel: '이상치 탐지',
  },
  OUTLIER_IMPUTATION: {
    icon: '🔄',
    name: '이상치 대체',
    ariaLabel: '이상치 대체',
  },
  OUTLIER_REMOVE: {
    icon: '✂️',
    name: '이상치 제거',
    ariaLabel: '이상치 제거',
  },
  ZSCORE_SCALING: {
    icon: '📏',
    name: 'Z-SCORE 스케일링',
    ariaLabel: 'Z-SCORE 스케일링',
  },
  MINMAX_SCALING: {
    icon: '📐',
    name: 'MIN-MAX 스케일링',
    ariaLabel: 'MIN-MAX 스케일링',
  },
  LOG_TRANSFORM: {
    icon: '📉',
    name: '로그 변환',
    ariaLabel: '로그 변환',
  },
  SQRT_TRANSFORM: {
    icon: '√',
    name: '제곱근 변환',
    ariaLabel: '제곱근 변환',
  },
  ONEHOT_ENCODING: {
    icon: '🔢',
    name: '원-핫 인코딩',
    ariaLabel: '원-핫 인코딩',
  },
  TARGET_ENCODING: {
    icon: '🎯',
    name: '타겟 인코딩',
    ariaLabel: '타겟 인코딩',
  },
  LABEL_ENCODING: {
    icon: '🏷️',
    name: '레이블 인코딩',
    ariaLabel: '레이블 인코딩',
  },
  CLASS_BALANCING: {
    icon: '⚖️',
    name: '클래스 불균형',
    ariaLabel: '클래스 불균형',
  },
  // 기존 코드에 있던 항목들도 유지
  MISSING_VALUE: {
    icon: '🧹',
    name: '결측치 처리',
    ariaLabel: '결측치 처리',
  },
  IMPUTATION: {
    icon: '🔋',
    name: '결측치 대체',
    ariaLabel: '결측치 대체',
  },
  NORMALIZATION: {
    icon: '📊',
    name: '표준화',
    ariaLabel: '표준화',
  },
  ENCODING: {
    icon: '🔣',
    name: '인코딩',
    ariaLabel: '인코딩',
  },
  FEATURE_ENGINEERING: {
    icon: '🛠️',
    name: '특성 공학',
    ariaLabel: '특성 공학',
  },
  PREPROCESSING_COMPLETE: {
    icon: '✅',
    name: '전처리 완료',
    ariaLabel: '전처리 완료',
  },
};

// 기본값 정의
const defaultConfig = {
  icon: '⚙️',
  name: '전처리 단계',
  ariaLabel: '전처리 단계',
};

export const PreprocessingPipelineCard = ({ steps }: PreprocessingPipelineCardProps) => {
  // 전처리 단계에 원본 데이터(시작)와 전처리 완료(끝) 항목 추가
  const fullPipeline = [
    { type: 'ORIGINAL_DATA', parameters: {}, order: 0, active: true },
    ...steps,
    {
      type: 'PREPROCESSING_COMPLETE',
      parameters: {},
      order: steps.length + 1,
      active: true,
    },
  ];

  return (
    <div className="bg-[theme(primary-white)] mb-4 rounded-lg p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-[var(--primary-black)]">전처리 파이프라인</h2>
      <p className="text-[theme(color-muted-foreground)] mb-2 text-sm">데이터에 적용된 전처리 과정과 세부 파라미터입니다</p>

      <div className="w-full overflow-x-auto py-6">
        <div className="flex items-center justify-between">
          {fullPipeline.map((step, index) => {
            // 해당 타입의 설정 가져오기 (없으면 기본값 사용)
            const config = preprocessingConfig[step.type] || defaultConfig;

            return (
              <div key={index} className="relative mx-2 flex flex-col items-center">
                {/* 아이콘 */}
                <div className="bg-[theme(primary-black)] border-[theme(color-blue-01)] mb-2 flex h-20 w-20 items-center justify-center rounded-full border-2">
                  <span role="img" aria-label={config.ariaLabel} className="font-tossface text-3xl">
                    {config.icon}
                  </span>
                </div>
                {/* 이름 */}
                <div className="text-center text-sm font-medium">{config.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
