import { useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { projectCategoryAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { completedDatasetAtom, dataColumnsAtom, pipelineIdAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { YouHadBetterAfterSchool, YouHaveToAfterSchool } from '@/shared/api/modelingApi';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiError } from '@/entities/project-detail/model/ApiTypes';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import { ForkPreprocessResponse } from '@/shared/model/types/modelingTypes';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';

export const useAfterSchool = () => {
  const router = useRouter();
  const projectDetail = useAtomValue(projectDetailAtom);
  const setProjectDetailAtom = useSetAtom(projectDetailAtom);
  const setProjectCategoryAtom = useSetAtom(projectCategoryAtom);
  const setCompletedDatasetAtom = useSetAtom(completedDatasetAtom);
  const setPipelineIdAtom = useSetAtom(pipelineIdAtom);
  const setDataColumnsAtom = useSetAtom(dataColumnsAtom);
  const setProjectTitle = useSetAtom(projectTitleAtom);

  const handleAfterSchoolClick = async (pipelineId: string, fromWhere?: string) => {
    try {
      if (fromWhere === 'PREPROCESSED' || fromWhere === 'FAILED') {
        console.log('리로딩/포크 중 리로딩');

        const response = await YouHadBetterAfterSchool(pipelineId);
        console.log('모델링 테스트 결과:', response);

        setProjectCategoryAtom(response.data.category);
        setPipelineIdAtom(response.data.pipelineId);
        setDataColumnsAtom(response.data.columns);
      } else {
        console.log('리로딩/포크 중 포크');

        const response = await YouHaveToAfterSchool(pipelineId);
        console.log('모델링 테스트 결과:', response);

        setProjectCategoryAtom(response.data.category);
        setPipelineIdAtom(response.data.pipelineId);
        setDataColumnsAtom(response.data.columns);
      }
      router.push('/workspace/modeling-section');
    } catch (error) {
      console.error('처리 중 오류가 발생했습니다:', error);
    }
  };
  const moveToPreprocessing = async (pipelineId: string, title: string) => {
    try {
      const response = await axiosInstance.post<ApiResponse<ForkPreprocessResponse>>(`/api/v2/pipelines/${pipelineId}/fork/preprocess`);

      const data = response.data.data;
      setPipelineIdAtom(data.pipelineId);
      setProjectTitle(title);

      router.push('/workspace/preprocess');
    } catch (error) {
      showErrorToast((error as ApiError).message);
    }
  };
  const testAfterSchoolClick = async (pipelineId: string) => {
    try {
      console.log('워크스페이스모델링테스트');

      const testCategory = 'CLASSIFICATION';
      const testColumns = [
        { name: 'age', type: 'numeric', description: '나이' },
        { name: 'income', type: 'numeric', description: '수입' },
        { name: 'gender', type: 'categorical', description: '성별' },
      ];
      setProjectCategoryAtom(testCategory);
      setPipelineIdAtom(pipelineId);
      setDataColumnsAtom(testColumns);
      router.push('/workspace/modeling-section');
    } catch (error) {
      console.error('처리 중 오류가 발생했습니다:', error);
    }
  };

  return { handleAfterSchoolClick, moveToPreprocessing, testAfterSchoolClick };
};
