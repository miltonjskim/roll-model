'use client';

import { useParams } from 'next/navigation';
import { PreprocessingPipelineCard } from '@/entities/project-detail/ui/data-section/PreprocessingPipelineCard';
import { useProjectDetailOverview } from '@/app/project-detail/[id]/model/useProjectDetailOverview';
import ModelOverview from '@/entities/project-detail/ui/model-section/ModelOverview';
import FeatureImportanceChart from '@/entities/project-detail/ui/model-section/FeatureImportanceChart';
import ApiStatusCard from '@/entities/project-detail/ui/api-section/ApiStatusCard';
import ApiEndpointCard from '@/entities/project-detail/ui/api-section/ApiEndpointCard';
import { MODEL_NAME_MAPPING } from '@/shared/api/mocks/modeling/modelingData';
import ModelInfoCard from '@/entities/project-detail/ui/model-section/ModelInfoCard';

export default function DataSectionPage() {
  const { id } = useParams();
  const pipelineId = id as string;

  const { projectDetailOverview, isLoading, isError } = useProjectDetailOverview(pipelineId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !projectDetailOverview) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">데이터를 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.</div>;
  }

  const { projectInfo, preprocessingSteps, algorithm, modelParameters, targetInfo,featureImportance, apiStatus, endpoint, inputSchema } = projectDetailOverview;

  // 모델명 한글 변환
  const algorithmName = algorithm;
  const koreanModelName = MODEL_NAME_MAPPING[algorithmName as keyof typeof MODEL_NAME_MAPPING] || algorithmName;

  return (
    <div>
      {/* 데이터 : 파이프라인 정보 */}
      <PreprocessingPipelineCard steps={preprocessingSteps} />
      {/* 모델 : 기본 정보 */}
      <ModelInfoCard
        category={projectInfo.category}
        algorithmName={algorithmName}
        koreanModelName={koreanModelName}
        modelParameters={modelParameters}
        targetInfo={targetInfo}
      />
      {/* 모델 : 특성중요도 */}
      <FeatureImportanceChart featureImportance={featureImportance} />
      {/* API : api상태정보 */}
      <ApiStatusCard apiStatus={apiStatus} endpoint={endpoint.url} inputSchema={inputSchema} />
      {/* API : 엔드포인트 */}
      <ApiEndpointCard endpoint={endpoint}></ApiEndpointCard>
    </div>
  );
}
