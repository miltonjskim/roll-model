"use client";

import { useParams } from "next/navigation";
import { useProjectDetailData } from "@/app/project-detail/[id]/data-section/model/useProjectDetailData";
import { DatasetInfoCard } from "@/entities/project-detail/ui/data-section/DatasetInfoCard";
import { PreprocessingPipelineCard } from "@/entities/project-detail/ui/data-section/PreprocessingPipelineCard";
import { DataSplitCard } from "@/entities/project-detail/ui/data-section/DataSplitCard";
import { DistributionCharts } from "@/entities/project-detail/ui/data-section/DistributionCharts";
import { CorrelationMatrix } from "@/entities/project-detail/ui/data-section/CorrelationMatrix";

export default function DataSectionPage() {
  const { id } = useParams();
  const pipelineId = id as string;

  const { projectDetailData, isLoading, isError } =
    useProjectDetailData(pipelineId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !projectDetailData) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        데이터를 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.
      </div>
    );
  }

  const {
    dataset,
    preprocessingSteps,
    dataSplit,
    distributions,
    correlationMatrix,
  } = projectDetailData;

  return (
    <div>
      {/* 데이터셋 기본 정보 */}
      <DatasetInfoCard dataset={dataset} />

      {/* 전처리 파이프라인 정보 */}
      <PreprocessingPipelineCard steps={preprocessingSteps} />

      {/* 데이터 분할 정보 */}
      <DataSplitCard dataSplit={dataSplit} />

      {/* 변수 분포 차트 */}
      <DistributionCharts distributions={distributions} />

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
