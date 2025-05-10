// /entities/project-detail/ui/PreprocessingPipelineCard.tsx
import { PreprocessingStep } from '@/entities/project-detail/model/dataTypes';

interface PreprocessingPipelineCardProps {
  steps: PreprocessingStep[];
}

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
          {fullPipeline.map((step, index) => (
            <div key={index} className="relative mx-2 flex flex-col items-center">
              {/* 아이콘 */}
              <div className="bg-[theme(color-gray-05)] border-[theme(color-blue-01)] mb-2 flex h-20 w-20 items-center justify-center rounded-full border-2">{getPreprocessingIcon(step.type)}</div>
              {/* 이름 */}
              <div className="text-center text-sm font-medium">{getPreprocessingStepName(step.type)}</div>
              {/* 설명 */}
              <div className="text-[theme(color-muted-foreground)] text-center text-xs">{getPreprocessingDescription(step)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 전처리 단계 아이콘
const getPreprocessingIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'ORIGINAL_DATA':
      return (
        <span role="img" aria-label="원본 데이터" className="text-3xl">
          📄
        </span>
      );
    case 'MISSING_VALUE':
      return (
        <span role="img" aria-label="결측치 처리" className="text-3xl">
          🧹
        </span>
      );
    case 'OUTLIER_DETECTION':
      return (
        <span role="img" aria-label="이상치 탐지" className="text-3xl">
          🧪
        </span>
      );
    case 'NORMALIZATION':
      return (
        <span role="img" aria-label="표준화" className="text-3xl">
          📏
        </span>
      );
    case 'ENCODING':
      return (
        <span role="img" aria-label="인코딩" className="text-3xl">
          🔄
        </span>
      );
    case 'PREPROCESSING_COMPLETE':
      return (
        <span role="img" aria-label="전처리 완료" className="text-3xl">
          ✅
        </span>
      );
    default:
      return (
        <span role="img" aria-label="전처리 단계" className="text-3xl">
          ⚙️
        </span>
      );
  }
};

// 전처리 단계 이름 변환 함수
const getPreprocessingStepName = (type: string): string => {
  const typeMap: Record<string, string> = {
    ORIGINAL_DATA: '원본 데이터',
    MISSING_VALUE: '결측치 처리',
    OUTLIER_DETECTION: '이상치 처리',
    NORMALIZATION: '표준화',
    ENCODING: '인코딩',
    PREPROCESSING_COMPLETE: '전처리 완료',
    // 다른 전처리 타입 추가
  };

  return typeMap[type] || type;
};

// 전처리 설명 생성 함수
// PreprocessingParameter 타입이 string | number | boolean | undefined
// null처리 + String 처리
const getPreprocessingDescription = (step: PreprocessingStep): string => {
  const { type, parameters } = step;

  switch (type) {
    case 'ORIGINAL_DATA':
      return '';
    case 'MISSING_VALUE':
      const imputationMethod = parameters.imputationMethod ?? '';
      return String(imputationMethod) === 'MEAN' ? '평균값 대체' : String(imputationMethod);
    case 'OUTLIER_DETECTION':
      const outlierMethod = parameters.outlierMethod ?? '';
      return String(outlierMethod) === 'Z_SCORE' ? 'Z-점수' : String(outlierMethod);
    case 'NORMALIZATION':
      return 'Z-점수';
    case 'ENCODING':
      return '원-핫 인코딩';
    case 'PREPROCESSING_COMPLETE':
      return '';
    default:
      return '';
  }
};
