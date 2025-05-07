import { ModelParameter, TargetInfo, PerformanceMetric } from '@/entities/project-detail/model/ModelTypes';
import { CLASSIFICATION_MODELS, REGRESSION_MODELS } from '@/shared/api/mocks/modeling/modelingData';

interface ModelOverviewProps {
  category: string;
  algorithmName: string;
  koreanModelName: string;
  modelParameters: ModelParameter[];
  targetInfo: TargetInfo[];
  performanceMetrics: PerformanceMetric[];
}
export default function ModelOverview({ category, algorithmName, koreanModelName, modelParameters, targetInfo, performanceMetrics }: ModelOverviewProps) {
  // 설명 찾아와버림
  const modelInfo = category === 'CLASSIFICATION' ? CLASSIFICATION_MODELS.find((model) => model.id === algorithmName) : REGRESSION_MODELS.find((model) => model.id === algorithmName);
  const description = modelInfo?.description;
  return (
    <>
      <div className="bg-[theme(primary-white)]">
        <p>{koreanModelName}</p>
        <p>{description}</p>
        <div className="flex gap-4">
          <div className="bg-[theme(color-blue-03)] rounded p-4">
            <div className="text-sm text-gray-600">{modelParameters[0].parameterName}</div>
            <div className="text-lg font-semibold">{modelParameters[0].parameterValue}</div>
          </div>

          <div className="bg-[theme(color-yellow-03)] rounded p-4">
            <div className="text-sm text-gray-600">{modelParameters[1].parameterName}</div>
            <div className="text-lg font-semibold">{modelParameters[1].parameterValue}</div>
          </div>

          <div className="bg-[theme(color-green-03)] rounded p-4">
            <div className="text-sm text-gray-600">{targetInfo[0].targetName}</div>
            <div className="text-lg font-semibold">{targetInfo[0].targetValue}</div>
          </div>

          <div className="bg-[theme(color-rose-03)] rounded p-4">
            <div className="text-sm text-gray-600">{targetInfo[1].durationName}</div>
            <div className="text-lg font-semibold">{targetInfo[1].durationValue}</div>
          </div>
        </div>
      </div>
      <div className="bg-[theme(primary-white)]">
        <p>모델 성능 한눈에 보기</p>
        <div className="flex gap-4">
          <div className="bg-[theme(color-blue-03)] rounded p-4">
            <div className="text-sm text-gray-600">{performanceMetrics[0].metricName}</div>
            <div className="text-lg font-semibold">{performanceMetrics[0].metricValue}</div>
          </div>

          <div className="bg-[theme(color-yellow-03)] rounded p-4">
            <div className="text-sm text-gray-600">{performanceMetrics[1].metricName}</div>
            <div className="text-lg font-semibold">{performanceMetrics[1].metricValue}</div>
          </div>

          <div className="bg-[theme(color-green-03)] rounded p-4">
            <div className="text-sm text-gray-600">{performanceMetrics[2].metricName}</div>
            <div className="text-lg font-semibold">{performanceMetrics[2].metricValue}</div>
          </div>

          <div className="bg-[theme(color-rose-03)] rounded p-4">
            <div className="text-sm text-gray-600">{performanceMetrics[3].metricName}</div>
            <div className="text-lg font-semibold">{performanceMetrics[3].metricValue}</div>
          </div>
        </div>
      </div>
    </>
  );
}
