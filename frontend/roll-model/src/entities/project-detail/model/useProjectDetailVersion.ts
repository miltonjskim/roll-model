import { useQuery } from "@tanstack/react-query";
import { fetchProjectDetailVersion } from "@/shared/api/projectDetailApi";
import { useAtom } from "jotai";
import { projectDetailAtom } from "@/shared/model/atoms/projectDetail.atoms";
import { useEffect } from "react";

export const useProjectDetailVersion = (pipelineId: string) => {
  const [projectDetail, setProjectDetail] = useAtom(projectDetailAtom);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["projectDetailVersion", pipelineId],
    queryFn: () => fetchProjectDetailVersion(pipelineId),
    enabled: !!pipelineId,
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 프로젝트 정보가 업데이트되면 atom 업데이트
  // Maximum update depth exceeded 오류 발생 : 의존성배열에서 projectDetail제거
  useEffect(() => {
    if (data?.data?.projectInfo) {
      setProjectDetail({
        ...projectDetail,
        ...data.data.projectInfo,
        id: pipelineId,
      });
    }
  }, [data, pipelineId, setProjectDetail]);
  // 함수형을 쓰라는데, 왜?
  // useEffect(() => {
  //   if (data?.data?.projectInfo) {
  //     setProjectDetail(prevDetail => ({
  //       ...prevDetail,
  //       ...data.data.projectInfo,
  //       id: pipelineId,
  //     }));
  //   }
  // }, [data, pipelineId, setProjectDetail]);

  return {
    projectDetailVersion: data?.data,
    isLoading,
    isError,
    error,
    refetch,
  };
};
