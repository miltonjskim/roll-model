'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { completedDatasetAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import PreprocessingOptions from '@/features/workspace/data-preprocess/ui/PreprocessingOptions';
import PreprocessingPipeline, { Step } from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';
import PreprocessingSummary from '@/features/workspace/data-preprocess/ui/PreprocessingSummary';
import PreprocessingTable from '@/features/workspace/data-preprocess/ui/PreprocessingTable';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import { useAtomValue, useSetAtom } from 'jotai';
import { ApiError } from 'next/dist/server/api-utils';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PreprocessDataPage = () => {
  const router = useRouter();
  const uploadedData = useAtomValue(uploadedDatasetAtom);
  const pipelineId = uploadedData?.pipelineId;
  const projectTitle = useAtomValue(projectTitleAtom);
  const optionRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>(undefined);
  const columnNames = uploadedData?.originalDatasets.columns;
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedSteps, setRecommendedSteps] = useState<Step[]>([]);
  const [changedCells, setChangedCells] = useState<Record<string, boolean>>({});
  const setCompletedDataset = useSetAtom(completedDatasetAtom);

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

  const requestAISuggestion = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(`/api/v2/pipelines/${pipelineId}/preprocessing/recommendation`);
      setRecommendedSteps(response.data.data.preprocessingSteps);
      console.log(response.data);
    } catch (error) {
      console.error('AI 추천 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mergeChangedCells = (newCells: Record<string, boolean>) => {
    setChangedCells((prev) => ({ ...prev, ...newCells }));
  };

  const handleCompletePreprocessing = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(`/api/v2/pipelines/${pipelineId}/preprocessing/complete`);
      setCompletedDataset(response.data.columns);

      router.push('/workspace/data-preprocess/complete');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showErrorToast(apiError.message);
      console.error(apiError);
    } finally {
      setIsLoading(false);
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
            <div className="mt-2 mb-4">
              <label htmlFor="column-select" className="text-sm font-medium">
                전처리할 컬럼 선택
              </label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="컬럼을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {columnNames?.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="">
              {/* 전처리 기능 목록 섹션 */}
              <div className="${ highlight ? 'shadow-accent' : '' mt-4 mb-10 transition-shadow duration-300" ref={optionRef}>
                <PreprocessingOptions pipelineId={pipelineId} column={selectedColumn} onChangeCells={mergeChangedCells} />
              </div>

              {/* AI 추천 버튼 */}
              <div className="mb-auto flex flex-col">
                <div className="text-center text-xs">
                  <span className="text-[var(--color-error-text)]">*</span>
                  <span className="">추천 결과 적용 시 기본 설정값이 자동으로 입력됩니다.</span>
                </div>

                <Button variant="black" size="lg" onClick={requestAISuggestion}>
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
              <PreprocessingPipeline onAdd={handleAddClick} recommendedSteps={recommendedSteps} />
            </div>
          </div>

          {/* 전처리된 데이터 미리보기 섹션 */}
          <div className="bg-[theme(primary-white)] rounded-md p-4">
            <div>
              <h4 className="text-[1.07rem] font-semibold">데이터 미리보기</h4>
              <p className="text-sm text-[var(--color-gray-01)]">적용된 전처리 결과를 미리 확인할 수 있습니다.</p>
              <p className="text-sm leading-[0.9] text-[var(--color-gray-01)]">변경된 데이터는 하이라이트로 표시됩니다.</p>
            </div>
            <PreprocessingTable changedCells={changedCells} />
          </div>

          {/* 전처리 종료 버튼 */}
          <Button variant="black" size="lg" className="w-full p-6" onClick={handleCompletePreprocessing}>
            전처리 결과 확인
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreprocessDataPage;
