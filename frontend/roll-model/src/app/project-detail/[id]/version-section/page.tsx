"use client";

import { useParams } from "next/navigation";
import { useProjectDetailVersion } from "@/entities/project-detail/model/useProjectDetailVersion";

export default function VersionSectionPage() {
  const { id } = useParams();
  const pipelineId = id as string;

  const { projectDetailVersion, isLoading, isError } =
    useProjectDetailVersion(pipelineId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[theme(color-blue-01)]"></div>
      </div>
    );
  }

  if (isError || !projectDetailVersion) {
    return (
      <div className="bg-[theme(color-error-background)] text-[theme(color-error)] p-4 rounded-lg">
        데이터를 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.
      </div>
    );
  }

  const { projectInfo, versionHistory, pipelines } = projectDetailVersion;

  return <div>버전탭</div>;
}
