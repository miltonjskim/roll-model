import { useQuery } from "@tanstack/react-query";
import { fetchProjectDetailData } from "@/shared/api/projectDetailApi";
import { useAtom } from "jotai";
import { projectDetailAtom } from "@/shared/model/atoms/projectDetail.atoms";
import { useEffect } from "react";

export const useProjectDetailData = (pipelineId: string) => {
  // atom get!
  const [projectDetail, setProjectDetail] = useAtom(projectDetailAtom);

  // React Query로 프로젝트 상세 데이터  getto!
  const { data, isLoading, isError, error, refetch } = useQuery({
    // 쿼리키 설정하고 캐싱 + 재요청
    queryKey: ["projectDetailData", pipelineId],
    // api호출
    queryFn: () => fetchProjectDetailData(pipelineId),
    // 예외처리 pipelineid없으면 실행안함
    enabled: !!pipelineId,
    // 무한츠쿠요미방지
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 프로젝트 정보가 업데이트되면 atom 업데이트
  useEffect(() => {
    // 잘가져왔다면
    if (data?.data?.projectInfo) {
      // 전부다 업데이트
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
