'use client';

import { Button } from '@/components/ui/button';
import { FileUploadDialog } from '@/features/workspace/data-upload/ui/FileUploadDialog';

const SelectDataPage = () => {
  const handleUseSampleData = () => {
    console.log('샘플 데이터 사용');
  };

  return (
    <div>
      <h1>프로젝트 데이터 선택</h1>
      <h2>데이터를 선택해 주세요</h2>

      <div className="mt-4 flex justify-center gap-4">
        <FileUploadDialog />
        <Button variant="outline" onClick={handleUseSampleData}>
          샘플 데이터 사용하기
        </Button>
      </div>
    </div>
  );
};

export default SelectDataPage;
