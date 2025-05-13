'use client';

import { Button } from '@/components/ui/button';
import { FileUploadDialog } from '@/features/workspace/data-upload/ui/FileUploadDialog';
import { useState } from 'react';

const SelectDataPage = () => {
  const [isHover, setIsHover] = useState(false);

  const handleUseSampleData = () => {
    console.log('샘플 데이터 사용');
  };

  const handleUseRegressionData = () => {
    console.log('회귀 선택');
  };

  const handleUseClassificationData = () => {
    console.log('분류 선택');
  };

  return (
    <div>
      <div className="select-none">
        <h1 className="text-xl font-bold">프로젝트 데이터 선택</h1>
        <h2>데이터를 선택해 주세요</h2>
      </div>

      <div className="mx-auto mt-4 max-w-[70rem] select-none">
        <div className="bg-[theme(primary-white)] flex h-120 justify-center gap-4 rounded-lg p-4">
          <FileUploadDialog />
          <div className="h-full flex-1/2 cursor-pointer rounded-lg border border-[var(--color-gray-03)]" onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
            {isHover ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex h-full w-full flex-col">
                  <div className="rounded-t-lg border-b border-[var(--color-gray-04)] p-3">
                    <p className="text-base font-semibold">
                      <span className="font-tossface mr-2">📊</span>샘플 데이터 사용하기
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col text-center">
                    {/* TODO: 각 데이터에 해당하는 설명 추가 */}
                    <div
                      className="hover:bg-[theme(primary-black)] flex flex-1 flex-col justify-center border-b border-[var(--color-gray-04)] p-4 hover:text-[var(--primary-white)]"
                      onClick={handleUseRegressionData}
                    >
                      <p className="font-bold">회귀 (연속형 변수)</p>
                      <p>데이터 설명 설명 설명</p>
                      <p>데이터 설명 설명 설명 데이터 설명</p>
                    </div>

                    <div className="hover:bg-[theme(primary-black)] flex flex-1 flex-col justify-center rounded-b-lg p-4 hover:text-[var(--primary-white)]" onClick={handleUseClassificationData}>
                      <p className="font-bold">분류 (범주형 변수)</p>
                      <p>데이터 설명 설명 설명</p>
                      <p>데이터 설명 설명 설명 데이터 설명</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-md font-semibold">
                  <span className="font-tossface mr-2">📊</span>샘플 데이터 사용하기
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-4"></div>
    </div>
  );
};

export default SelectDataPage;
