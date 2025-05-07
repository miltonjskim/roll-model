import { useQuery } from '@tanstack/react-query';
import { fetchProjectDetailData } from '@/shared/api/projectDetailApi';
import { useAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useEffect } from 'react';

export const useProjectDetailData = (pipelineId: string) => {
  // atom get!
  //의존성 배열에서 projectDetail을 제거
  const [, setProjectDetail] = useAtom(projectDetailAtom);

  // React Query로 프로젝트 상세 데이터  getto!
  const { data, isLoading, isError, error, refetch } = useQuery({
    // 쿼리키 설정하고 캐싱 + 재요청
    queryKey: ['projectDetailData', pipelineId],
    // api호출
    queryFn: () => fetchProjectDetailData(pipelineId),
    // 예외처리 pipelineid없으면 실행안함
    enabled: !!pipelineId,
    // 무한츠쿠요미방지
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 프로젝트 정보가 업데이트되면 atom 업데이트
  useEffect(() => {
    if (data?.data?.projectInfo) {
      //projectDetail값에 의존함 but projectDetail을 의존성 배열에 추가하면 무한루프
      // projectDetail을 빼버리고 prevstate로 처리하여 의존성 배열에서 projectDetail을 제거 
      setProjectDetail((prevState) => ({
        ...prevState,
        ...data.data.projectInfo,
        id: pipelineId,
      }));
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
