'use client';

import { Button } from '@/components/ui/button';
import { completedDatasetAtom, dataColumns, pipelineIdAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { projectCategoryAtom } from '@/entities/workspace/model/projectAtoms';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const CompletePreprocessDataPage = () => {
  const completedUploadset = useAtomValue(completedDatasetAtom);
  const router = useRouter();
  const setPipelineId = useSetAtom(pipelineIdAtom);
  const setProjectCategory = useSetAtom(projectCategoryAtom);
  const setDataColumns = useSetAtom(dataColumns);

  console.log('completedUploadset:', completedUploadset);

  useEffect(() => {
    if (!completedUploadset) {
      showErrorToast('전처리 완료 정보가 없습니다.');
      router.push('/workspace');
    } else {
      console.log('completedUploadset:', completedUploadset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedUploadset]);

  const handleMoveModelingPage = () => {
    if (!completedUploadset) {
      showErrorToast('전처리 완료 정보가 없습니다.');
      return;
    }

    const { pipelineId, columns, category } = completedUploadset;

    if (!pipelineId || !columns || !category) {
      showErrorToast('필수 정보가 누락되었습니다.');
      return;
    }

    setPipelineId(pipelineId);
    setDataColumns(columns);
    setProjectCategory(category);

    router.push('/workspace/modeling-section');
  };

  return (
    <div>
      <h1>데이터 전처리 끝</h1>

      <div>
        <Button onClick={handleMoveModelingPage} variant="black">
          모델 학습하기
        </Button>
      </div>
    </div>
  );
};

export default CompletePreprocessDataPage;
