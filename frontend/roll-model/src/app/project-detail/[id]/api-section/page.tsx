'use client';
import { useProjectDetailApi } from '@/app/project-detail/[id]/api-section/model/useProjectDetailApi';
import ApiDownloadCard from '@/entities/project-detail/ui/api-section/ApiDownloadCard';
import ApiEndpointCard from '@/entities/project-detail/ui/api-section/ApiEndpointCard';
import ApiExamplesCard from '@/entities/project-detail/ui/api-section/ApiExamplesCard';
import ApiStatusCard from '@/entities/project-detail/ui/api-section/ApiStatusCard';
import { useParams } from 'next/navigation';

export default function ApiSectionPage() {
  const { id } = useParams();
  const pipelineId = id as string;

  const { projectDetailApi, isLoading, isError } = useProjectDetailApi(pipelineId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !projectDetailApi) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">데이터를 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.</div>;
  }

  const { apiStatus: apiStatusInfo, endpoint, inputSchema } = projectDetailApi;

  return (
    <>
      <ApiDownloadCard pipelineId={pipelineId}></ApiDownloadCard>
      <ApiStatusCard apiStatus={projectDetailApi.apiStatus} endpoint={projectDetailApi.endpoint.url} inputSchema={projectDetailApi.inputSchema} />
      <ApiEndpointCard endpoint={endpoint}></ApiEndpointCard>
      <ApiExamplesCard inputSchema={inputSchema} endpoint={endpoint} projectCategory={projectDetailApi.projectInfo.category}></ApiExamplesCard>
    </>
  );
}
