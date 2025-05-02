// app/project-detail/[id]/version-section/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useProjectDetailVersion } from "@/app/project-detail/[id]/version-section/model/useProjectDetailVersion";
import { ReactFlowProvider } from "reactflow";
import VersionGraphDagre from "@/entities/project-detail/ui/version-section/VersionGraphDagre";
import VersionDetailCard from "@/entities/project-detail/ui/version-section/VersionDetailCard";
import { useProjectDetailVersionSelection } from "./model/useProjectDetailVersionSelection";

export default function VersionSectionPage() {
  const { id } = useParams();
  const pipelineId = id as string;

  // API 데이터 페칭 훅
  const { projectDetailVersion, isLoading, isError } =
    useProjectDetailVersion(pipelineId);

  // 버전 선택 관리 훅
  const {
    selectedVersion,
    selectedPipeline,
    versionHistory,
    handleSelectVersion,
  } = useProjectDetailVersionSelection(projectDetailVersion);

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

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">버전 정보</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
          {/* 왼쪽: 버전 그래프 */}
          <div className="w-full lg:w-full">
            {versionHistory.length > 0 && (
              <ReactFlowProvider>
                <VersionGraphDagre
                  versionHistory={versionHistory}
                  selectedVersion={selectedVersion}
                  onSelectVersion={handleSelectVersion}
                  selectedPipeline={selectedPipeline}
                />
              </ReactFlowProvider>
            )}
          </div>

          {/* 오른쪽: 버전 상세 정보 */}
          {/* <div className="w-full lg:w-1/2">
            {selectedPipeline ? (
              <VersionDetailCard pipeline={selectedPipeline} />
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
                버전을 선택하여 상세 정보를 확인하세요.
              </div>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
}
