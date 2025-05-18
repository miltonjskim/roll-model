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
import ProjectDetailCard, { CardProps } from '@/widgets/project/project-detail/ProjectDetailCard';

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

  const propsInfo: Record<string, CardProps> = {
    ModelInfoCard: {},
    PerformanceMetricsCard: {
      title: '모델성능 한눈에 보기',
      sub: '모델이 얼마나 정확하게 예측하는지 보여주는 중요한 지표들입니다',
    },
    ClassificationEvaluation: {
      title: '분류모델 평가',
    },
    RegressionEvaluation: {
      title: '회귀모델 평가',
    },
    FeatureImportanceChart: {
      title: '특성 중요도',
      sub: '모델의 예측에 각 특성이 미치는 영향력을 보여줍니다. 막대가 길수록 모델 예측에 더 중요한 역할을 합니다.',
    },
  };

  return (
    <div>
      {/* 모델정보 */}
      <ProjectDetailCard cardProps={propsInfo.ModelInfoCard}>
        <ModelInfoCard
          category={projectDetailModel.projectInfo.category}
          algorithmName={algorithmName}
          koreanModelName={koreanModelName}
          modelParameters={projectDetailModel.modelParameters}
          targetInfo={projectDetailModel.targetInfo}
        />
      </ProjectDetailCard>
      {/* 모델성능 */}
      <ProjectDetailCard cardProps={propsInfo.PerformanceMetricsCard}>
        <PerformanceMetricsCard performanceMetrics={projectDetailModel.performanceMetrics} />
      </ProjectDetailCard>

      {/* <ProjectDetailCard cardProps={propsInfo.ClassificationEvaluation}></ProjectDetailCard>
      <ProjectDetailCard cardProps={propsInfo.RegressionEvaluation}></ProjectDetailCard>
      <ProjectDetailCard cardProps={propsInfo.FeatureImportanceChart}></ProjectDetailCard> */}

      {isClassification && (projectDetailModel as ClassificationModelData).confusionMatrix && (
        <ClassificationEvaluation confusionMatrix={(projectDetailModel as ClassificationModelData).confusionMatrix} />
      )}

      {isRegression && (
        <RegressionEvaluation actualVsPredicted={(projectDetailModel as RegressionModelData).actualVsPredicted} residualPlot={(projectDetailModel as RegressionModelData).residualPlot} />
      )}

      <FeatureImportanceChart featureImportance={projectDetailModel.featureImportance} />
    </div>
  );
}
