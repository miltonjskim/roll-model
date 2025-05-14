import { useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { projectCategoryAtom } from '@/entities/workspace/model/projectAtoms';
import { completedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { YouHaveToAfterSchool } from '@/shared/api/modelingApi';

export const useAfterSchool = () => {
  const router = useRouter();
  const projectDetail = useAtomValue(projectDetailAtom);
  const setProjectDetailAtom = useSetAtom(projectDetailAtom);
  const setProjectCategoryAtom = useSetAtom(projectCategoryAtom);
  const setCompletedDatasetAtom = useSetAtom(completedDatasetAtom);

  const handleAfterSchoolClick = async (pipelineId: string) => {
    try {
      const response = await YouHaveToAfterSchool(pipelineId);
      console.log('모델링 테스트 결과:', response);

      setProjectCategoryAtom(response.data.category);

      setProjectDetailAtom({
        ...projectDetail,
        id: pipelineId,
        category: response.data.category,
      });

      setCompletedDatasetAtom({
        pipelineId: response.data.pipelineId,
        columns: response.data.columns,
      });
      console.log(completedDatasetAtom);

      router.push('/workspace/modeling-section');
    } catch (error) {
      console.error('처리 중 오류가 발생했습니다:', error);
    }
  };

  return { handleAfterSchoolClick };
};
