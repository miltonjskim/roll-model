// /entities/project-detail/model/useProjectDetailData.ts
import { useQuery } from "@tanstack/react-query";
import { fetchProjectDetailData } from "@/shared/api/projectDetailApi";
import { useAtom } from "jotai";
import { projectDetailAtom } from "@/shared/model/atoms/projectDetail.atoms";
import { useEffect } from "react";

export const useProjectDetailData = (pipelineId: number) => {
  const [projectDetail, setProjectDetail] = useAtom(projectDetailAtom);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["projectDetailData", pipelineId],
    queryFn: () => fetchProjectDetailData(pipelineId),
    enabled: !!pipelineId,
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 프로젝트 정보가 업데이트되면 atom 업데이트
  useEffect(() => {
    if (data?.data?.projectInfo) {
      setProjectDetail({
        ...projectDetail,
        ...data.data.projectInfo,
        id: pipelineId,
      });
    }
  }, [data, pipelineId, setProjectDetail]);

  return {
    projectDetailData: data?.data,
    isLoading,
    isError,
    error,
    refetch,
  };
};