'use client';

import { useParams, useRouter } from 'next/navigation';
import { PreprocessingPipelineCard } from '@/entities/project-detail/ui/data-section/PreprocessingPipelineCard';
import { useProjectDetailOverview } from '@/app/project-detail/[id]/model/useProjectDetailOverview';
import FeatureImportanceChart from '@/entities/project-detail/ui/model-section/FeatureImportanceChart';
import ApiStatusCard from '@/entities/project-detail/ui/api-section/ApiStatusCard';
import ApiEndpointCard from '@/entities/project-detail/ui/api-section/ApiEndpointCard';
import { MODEL_NAME_MAPPING } from '@/shared/api/mocks/modeling/modelingData';
import ModelInfoCard from '@/entities/project-detail/ui/model-section/ModelInfoCard';
import { useAtomValue } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import Link from 'next/link';

export default function OverviewSectionPage() {
  const router = useRouter();
  const { id } = useParams();
  const pipelineId = id as string;
  const projectDetail = useAtomValue(projectDetailAtom);

  const {
    // 각 탭의 데이터
    projectDetailData,
    projectDetailModel,
    projectDetailApi,
    apiStatus,
    // 각 탭의 개별 로딩 상태
    isDataLoading,
    isModelLoading,
    isApiLoading,
    isApiStatusLoading,
    // 각 탭의 개별 에러 상태
    isDataError,
    isModelError,
    isApiError,
    isApiStatusError,
    // 각 탭의 개별 에러 객체
    dataError,
    modelError,
    apiError,
    // 통합 상태
    isLoading,
    isError,
    // 리프레시 함수
    refetchData,
    refetchModel,
    refetchApi,
    refreshApiStatus,
    refetchAll,
  } = useProjectDetailOverview(pipelineId);

  // 통합 에러 상태
  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        <p className="mb-4">데이터를 불러오는 중 오류가 발생했습니다.</p>
        <button onClick={() => refetchAll()} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
          다시 시도
        </button>
      </div>
    );
  }

  // 모델(랜덤포레스트 이런거)명 한글 변환
  const algorithmName = projectDetailModel?.algorithm;
  const koreanModelName = MODEL_NAME_MAPPING[algorithmName as keyof typeof MODEL_NAME_MAPPING] || algorithmName;

  return (
    <div className="space-y-6">
      {/* 데이터 섹션 */}
      <div className="col-span-1 md:col-span-2 lg:col-span-1">
        {isDataLoading || !projectDetailData ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-lg border border-[var(--color-gray-03)] p-4 shadow-sm">
            <SectionHeader title="데이터 섹션" tabLink={`/project-detail/${pipelineId}/data`} isLoading={isDataLoading} isError={isDataError} onRetry={() => refetchAll()} />
            {/* <h3 className="mb-4 text-lg font-medium">데이터 파이프라인</h3> */}
            <PreprocessingPipelineCard steps={projectDetailData.preprocessingSteps} />
          </div>
        )}
      </div>

      {/* 모델 섹션 - 기본 정보 */}
      <div className="col-span-1">
        {isModelLoading || !projectDetailModel || !algorithmName || !koreanModelName ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-lg border border-[var(--color-gray-03)] p-4 shadow-sm">
            <SectionHeader title="모델 섹션" tabLink={`/project-detail/${pipelineId}/model`} isLoading={isModelLoading} isError={isModelError} onRetry={() => refetchAll()} />
            {/* <h3 className="mb-4 text-lg font-medium">모델 정보</h3> */}
            <ModelInfoCard
              category={projectDetail.category}
              algorithmName={algorithmName}
              koreanModelName={koreanModelName}
              modelParameters={projectDetailModel.modelParameters}
              targetInfo={projectDetailModel.targetInfo}
            />
          </div>
        )}
      </div>

      {/* 모델 섹션 - 특성 중요도 */}
      <div className="col-span-1 md:col-span-2 lg:col-span-1">
        {isModelLoading || !projectDetailModel ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-lg border border-[var(--color-gray-03)] p-4 shadow-sm">
            {/* <h3 className="mb-4 text-lg font-medium">특성 중요도</h3> */}
            <FeatureImportanceChart featureImportance={projectDetailModel.featureImportance} />
          </div>
        )}
      </div>

      {/* API 섹션 - 상태 정보 */}
      <div className="col-span-1 md:col-span-1">
        {isApiLoading || isApiStatusLoading || !projectDetailApi ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-lg border border-[var(--color-gray-03)] p-4 shadow-sm">
            <SectionHeader title="API 섹션" tabLink={`/project-detail/${pipelineId}/api`} isLoading={isApiLoading} isError={isApiError} onRetry={() => refetchAll()} />
            {/* <h3 className="mb-4 text-lg font-medium">API 상태</h3> */}
            <ApiStatusCard apiStatus={projectDetailApi.apiStatus} endpoint={projectDetailApi.endpoint.url} inputSchema={projectDetailApi.inputSchema} />
          </div>
        )}
      </div>

      {/* API 섹션 - 엔드포인트 */}
      <div className="col-span-1 md:col-span-1 lg:col-span-2">
        {isApiLoading || !projectDetailApi ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-lg border border-[var(--color-gray-03)] p-4 shadow-sm">
            {/* <h3 className="mb-4 text-lg font-medium">API 엔드포인트</h3> */}
            <ApiEndpointCard endpoint={projectDetailApi.endpoint} />
          </div>
        )}
      </div>
    </div>
  );
}

// 섹션 헤더 컴포넌트
function SectionHeader({ title, tabLink, isLoading, isError, onRetry }: { title: string; tabLink: string; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  return (
    <div className="mb-4 flex h-16 items-center justify-between gap-2">
      <div className="bg-[theme(primary-white)] flex w-full items-center justify-between rounded-lg p-4 shadow-sm">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="flex h-full items-center space-x-2">
        {/* {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-[var(--primary-black)]"></div>} */}
        {isError && (
          <button
            onClick={onRetry}
            className="font-tossface flex h-full w-12 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-black)] text-[var(--primary-white)] shadow-sm select-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-gray-01)] duration-300 ease-out hover:border-[var(--color-rose-02)]">🔃</div>
          </button>
        )}
        <Link
          href={tabLink}
          className="flex h-full w-24 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-black)] text-[var(--primary-white)] shadow-sm select-none"
        >
          자세히 보기
        </Link>
      </div>
    </div>
  );
}

// 스켈레톤 로딩 카드
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--color-gray-03)] p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="mb-4 h-16 w-full animate-pulse rounded bg-gray-200"></div>
        <div className="mb-4 h-16 w-24 animate-pulse rounded bg-gray-200"></div>
      </div>
      <div className="w-full animate-pulse space-y-3 rounded bg-gray-200 p-4">
        <div className="h-8 w-1/6 animate-pulse rounded bg-gray-100"></div>
        <div className="h-6 w-1/4 animate-pulse rounded bg-gray-100"></div>
        <div className="h-20 w-5/6 animate-pulse rounded bg-gray-100"></div>
      </div>
    </div>
  );
}
