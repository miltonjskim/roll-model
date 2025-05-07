import { useQuery } from '@tanstack/react-query';
import { fetchProjectDetailModel } from '@/shared/api/projectDetailApi';
import { useAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useEffect } from 'react';
import { ProjectDetailModelResponse, isClassificationModel, isRegressionModel } from '@/entities/project-detail/model/ModelTypes';

export const useProjectDetailModel = (pipelineId: string) => {
  const [, setProjectDetail] = useAtom(projectDetailAtom);

  const { data, isLoading, isError, error, refetch } = useQuery<ProjectDetailModelResponse>({
    queryKey: ['projectDetailModel', pipelineId],
    queryFn: () => fetchProjectDetailModel(pipelineId),
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

  // 추가: 모델 타입에 따른 처리
  const isClassification = data?.data ? isClassificationModel(data.data) : false;
  const isRegression = data?.data ? isRegressionModel(data.data) : false;

  return {
    projectDetailModel: data?.data,
    isLoading,
    isError,
    error,
    refetch,
    // 추가: 모델 타입 플래그 추가
    isClassification,
    isRegression,
  };
};
