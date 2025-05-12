'use client';

import { Button } from '@/components/ui/button';
import { completedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const CompletePreprocessDataPage = () => {
  const completedUploadset = useAtomValue(completedDatasetAtom);
  const router = useRouter();

  console.log('completedUploadset:', completedUploadset);

  useEffect(() => {
    if (!completedUploadset) {
      return;
    } else {
      console.log('completedUploadset:', completedUploadset);
    }
  }, [completedUploadset]);

  const handleMoveModelingPage = () => {
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
