import { useQuery } from '@tanstack/react-query';
import { fetchProjectDetailVersion } from '@/shared/api/projectDetailApi';
import { useAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useEffect } from 'react';

export const useProjectDetailVersion = (pipelineId: string) => {
  const [, setProjectDetail] = useAtom(projectDetailAtom);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projectDetailVersion', pipelineId],
    queryFn: () => fetchProjectDetailVersion(pipelineId),
    enabled: !!pipelineId,
    staleTime: 1000 * 60 * 5, // 5분
  });

  useEffect(() => {
    if (data?.data?.projectInfo) {
      setProjectDetail((prevState) => ({
        ...prevState,
        ...data.data.projectInfo,
        id: pipelineId,
      }));
    }
  }, [data, pipelineId, setProjectDetail]);

  return {
    projectDetailVersion: data?.data,
    isLoading,
    isError,
    error,
    refetch,
  };
};
