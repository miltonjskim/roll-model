'use client';

import { uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

const PreprocessDataPage = () => {
  const uploadedData = useAtomValue(uploadedDatasetAtom);

  useEffect(() => {
    if (!uploadedData) {
      return;
    } else {
      console.log('원본 데이터셋 업로드 응답값:', uploadedData);
    }
  }, [uploadedData]);
  return (
    <div>
      <div>{uploadedData?.pipelineId}</div>
    </div>
  );
};

export default PreprocessDataPage;
