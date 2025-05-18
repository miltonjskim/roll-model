'use client';

import { useParams } from 'next/navigation';
import { useProjectDetailData } from '@/app/project-detail/[id]/data-section/model/useProjectDetailData';
import { DatasetInfoCard } from '@/entities/project-detail/ui/data-section/DatasetInfoCard';
import { PreprocessingPipelineCard } from '@/entities/project-detail/ui/data-section/PreprocessingPipelineCard';
import { DataSplitCard } from '@/entities/project-detail/ui/data-section/DataSplitCard';
import { DistributionCharts } from '@/entities/project-detail/ui/data-section/DistributionCharts';
import { CorrelationMatrix } from '@/entities/project-detail/ui/data-section/CorrelationMatrix';
import ProjectDetailCard, { CardProps } from '@/widgets/project/project-detail/ProjectDetailCard';

export default function DataSectionPage() {
  const { id } = useParams();
  const pipelineId = id as string;

  const { projectDetailData, isLoading, isError } = useProjectDetailData(pipelineId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !projectDetailData) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">데이터를 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.</div>;
  }

  const { dataset, preprocessingSteps, dataSplit, distributions, correlationMatrix } = projectDetailData;

  const propsInfo: Record<string, CardProps> = {
    DatasetInfoCard: {
      title: '데이터 한눈에 보기',
    },
    PreprocessingPipelineCard: {
      title: '전처리 파이프라인',
      sub: '데이터에 적용된 전처리 과정과 세부 파라미터입니다',
    },
    DataSplitCard: {
      title: '데이터 분할 정보',
    },
    DistributionCharts: {
      title: '주요 변수 분포',
    },
  };

  return (
    <div>
      {/* 데이터셋 기본 정보 */}
      <ProjectDetailCard cardProps={propsInfo.DatasetInfoCard}>
        <DatasetInfoCard dataset={dataset} />
      </ProjectDetailCard>

      {/* 전처리 파이프라인 정보 */}
      <ProjectDetailCard cardProps={propsInfo.PreprocessingPipelineCard}>
        <PreprocessingPipelineCard steps={preprocessingSteps} />
      </ProjectDetailCard>

      {/* 데이터 분할 정보 */}
      <ProjectDetailCard cardProps={propsInfo.DataSplitCard}>
        <DataSplitCard dataSplit={dataSplit} />
      </ProjectDetailCard>

      {/* 변수 분포 차트 */}
      <ProjectDetailCard cardProps={propsInfo.DistributionCharts}>
        <DistributionCharts distributions={distributions} />
      </ProjectDetailCard>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* 상관관계 행렬 */}
        <div className="w-full">
          <CorrelationMatrix correlationMatrix={correlationMatrix} />
        </div>
        <div className="w-full">temp</div>
      </div>
    </div>
  );
}
