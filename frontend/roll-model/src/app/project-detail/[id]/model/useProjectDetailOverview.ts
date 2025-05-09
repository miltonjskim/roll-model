import { useQuery } from '@tanstack/react-query';
import { fetchProjectDetailOverview } from '@/shared/api/projectDetailApi';
import { useAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useEffect } from 'react';

export const useProjectDetailOverview = (pipelineId: string) => {
  const [, setProjectDetail] = useAtom(projectDetailAtom);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projectDetailOverview', pipelineId],
    queryFn: () => fetchProjectDetailOverview(pipelineId),
    enabled: !!pipelineId,
    staleTime: 1000 * 60 * 5,
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
    projectDetailOverview: data?.data,
    isLoading,
    isError,
    error,
    refetch,
  };
};
