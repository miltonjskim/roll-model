'use client';

import { useProjectDetailModel } from '@/app/project-detail/[id]/modeling-section/model/useProjectDetailModel';
import { ClassificationModelData, RegressionModelData } from '@/entities/project-detail/model/ModelTypes';
import { MODEL_NAME_MAPPING } from '@/shared/api/mocks/modeling/modelingData';
import { useParams } from 'next/navigation';
import ModelOverview from '@/entities/project-detail/ui/model-section/ModelOverview';
import ClassificationEvaluation from '@/entities/project-detail/ui/model-section/ClassificationEvaluation';
import RegressionEvaluation from '@/entities/project-detail/ui/model-section/RegressionEvaluation';
import FeatureImportanceChart from '@/entities/project-detail/ui/model-section/FeatureImportanceChart';
import ModelInfoCard from '@/entities/project-detail/ui/model-section/ModelInfoCard';
import PerformanceMetricsCard from '@/entities/project-detail/ui/model-section/PerformanceMetricsCard';

export default function ModelSectionPage() {
  const { id } = useParams();
  const pipelineId = id as string;

  const { projectDetailModel, isLoading, isError, isClassification, isRegression } = useProjectDetailModel(pipelineId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !projectDetailModel) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">데이터를 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.</div>;
  }

  // 모델명 한글 변환
  const algorithmName = projectDetailModel.algorithm;
  const koreanModelName = MODEL_NAME_MAPPING[algorithmName as keyof typeof MODEL_NAME_MAPPING] || algorithmName;

  return (
    <div className="space-y-8 p-4">
      <ModelInfoCard
        category={projectDetailModel.projectInfo.category}
        algorithmName={algorithmName}
        koreanModelName={koreanModelName}
        modelParameters={projectDetailModel.modelParameters}
        targetInfo={projectDetailModel.targetInfo}
      />

      <PerformanceMetricsCard
        performanceMetrics={projectDetailModel.performanceMetrics}
      />

      {isClassification && <ClassificationEvaluation confusionMatrix={(projectDetailModel as ClassificationModelData).confusionMatrix} />}

      {isRegression && (
        <RegressionEvaluation actualVsPredicted={(projectDetailModel as RegressionModelData).actualVsPredicted} residualPlot={(projectDetailModel as RegressionModelData).residualPlot} />
      )}

      <FeatureImportanceChart featureImportance={projectDetailModel.featureImportance} />
    </div>
  );
}
