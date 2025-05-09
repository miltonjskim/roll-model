'use client';

import { Button } from '@/components/ui/button';
import { uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import PreprocessingOptions from '@/features/workspace/data-preprocess/ui/PreprocessingOptions';
import PreprocessingPipeline from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';
import PreprocessingSummary from '@/features/workspace/data-preprocess/ui/PreprocessingSummary';
import PreprocessingTable from '@/features/workspace/data-preprocess/ui/PreprocessingTable';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

const PreprocessDataPage = () => {
  const uploadedData = useAtomValue(uploadedDatasetAtom);
  const projectTitle = useAtomValue(projectTitleAtom);
  const optionRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (!uploadedData) {
      return;
    } else {
      console.log('원본 데이터셋 업로드 응답값:', uploadedData);
    }
  }, [uploadedData]);

  const handleAddClick = () => {
    if (optionRef.current) {
      optionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1000);
    }
  };

  return (
    <div className="mx-auto">
      <div>
        <h1 className="text-xl font-bold">전처리 설정하기</h1>
        <h2>필요한 전처리 기능을 선택하고, 데이터를 다듬어주세요.</h2>
      </div>

      <div className="mt-4 flex w-[100%] justify-center gap-4">
        <div className="flex flex-1 flex-col gap-4">
          {/* 프로젝트 이름 섹션 */}
          <div className="bg-[theme(primary-white)] rounded-md p-4">
            <h3 className="text-lg font-semibold">
              <span className="font-tossface">📌</span>
              <span className="ml-2">{projectTitle}</span>
            </h3>
          </div>

          {/* 전처리 기능 선택 섹션 */}
          <div className="bg-[theme(primary-white)] rounded-md p-4 text-left">
            <h4 className="text-[1.07rem] font-semibold">전처리 기능 선택</h4>

            <div className="">
              {/* 전처리 기능 목록 섹션 */}
              <div className="${ highlight ? 'shadow-accent' : '' mt-4 mb-10 transition-shadow duration-300" ref={optionRef}>
                <PreprocessingOptions />
              </div>

              {/* AI 추천 버튼 */}
              <div className="mb-auto flex flex-col">
                <div className="text-center text-xs">
                  <span className="text-[var(--color-error-text)]">*</span>
                  <span className="">추천 결과 적용 시 기본 설정값이 자동으로 입력됩니다.</span>
                </div>

                <Button variant="black" size="lg">
                  AI 추천 결과 적용하기
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1/3 shrink-0 basis-[35rem] flex-col gap-4 text-left">
          <div className="flex gap-4">
            {/* 내 데이터 요약 섹션 */}
            <div className="bg-[theme(primary-white)] flex-1/3 basis-[23rem] rounded-md p-4">
              <div>
                <h4 className="text-[1.07rem] font-semibold">내 데이터 요약</h4>
                <p className="text-sm text-[var(--color-gray-01)]">전처리로 결측치와 이상치를 수정할 수 있습니다.</p>
              </div>

              <PreprocessingSummary />
            </div>

            {/* 적용된 전처리 단계 파이프라인 섹션 */}
            <div className="bg-[theme(primary-white)] flex-2/3 rounded-md p-4">
              <div>
                <h4 className="text-[1.07rem] font-semibold">적용한 전처리 단계</h4>
                <p className="text-sm text-[var(--color-gray-01)]">현재까지 적용한 전처리 과정을 확인할 수 있습니다.</p>
                <p className="text-sm leading-[0.9] text-[var(--color-gray-01)]">단계를 삭제하거나 추가할 수 있습니다.</p>
              </div>
              <PreprocessingPipeline onAdd={handleAddClick} />
            </div>
          </div>

          {/* 전처리된 데이터 미리보기 섹션 */}
          <div className="bg-[theme(primary-white)] rounded-md p-4">
            <div>
              <h4 className="text-[1.07rem] font-semibold">데이터 미리보기</h4>
              <p className="text-sm text-[var(--color-gray-01)]">적용된 전처리 결과를 미리 확인할 수 있습니다.</p>
              <p className="text-sm leading-[0.9] text-[var(--color-gray-01)]">변경된 데이터는 하이라이트로 표시됩니다.</p>
            </div>
            <PreprocessingTable />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 text-left">
          {/* 전처리 결과 후 어떻게 변화됐는지 확인하는 섹션 */}
          <div className="bg-[theme(primary-white)] rounded-md p-4">
            <div>
              <h4 className="text-[1.07rem] font-semibold">전처리 효과 요약</h4>
              <p className="text-sm text-[var(--color-gray-01)]">전처리 적용 후 결과를 확인할 수 있습니다.</p>
            </div>
          </div>

          {/* 전처리 종료 버튼 */}
          <Button variant="black" size="lg" className="w-full p-6">
            전처리 결과 확인
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreprocessDataPage;
