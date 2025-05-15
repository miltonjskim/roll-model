'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { completedDatasetAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { Step } from '@/entities/workspace/data-preprocess/model/types';
import { projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import PreprocessingOptions from '@/features/workspace/data-preprocess/ui/PreprocessingOptions';
import PreprocessingPipeline from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';
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
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedSteps, setRecommendedSteps] = useState<Step[]>([]);
  const [changedCells, setChangedCells] = useState<Record<string, boolean>>({});
  const setCompletedDataset = useSetAtom(completedDatasetAtom);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (!uploadedData) {
      showErrorToast(
        <>
          데이터셋 정보가 존재하지 않습니다.
          <br />
          프로젝트 생성 페이지로 이동합니다.
        </>,
      );
      router.push('/workspace');
      return;
    } else {
      console.log('원본 데이터셋 업로드 응답값:', uploadedData);
    }
  }, [uploadedData, router]);

  const handleAddStep = (newStep: Step) => {
    setSteps((prev) => [...prev, newStep]);
  };

  const requestAISuggestion = async () => {
    setIsLoading(true);
    try {
      // TODO: AI 요청 url 변경
      const response = await axiosInstance.post(`/api/v1/pipelines/${pipelineId}/preprocessing/recommendation`);
      setRecommendedSteps(response.data.data.preprocessingSteps);
      console.log(response.data);
    } catch (error) {
      console.error('AI 추천 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeCells = (newCells: Record<string, boolean>) => {
    setChangedCells(newCells);
  };

  const handleCompletePreprocessing = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(`/api/v2/pipelines/${pipelineId}/preprocessing/complete`);

      console.log('response:', response);

      setCompletedDataset(response.data.data.data);

      router.push('/workspace/data-preprocess/complete');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showErrorToast(apiError.message);
      console.error(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStep = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(`/api/v2/pipelines/${pipelineId}/preprocessing/delete`);

      setSteps((prev) => prev.slice(0, -1));
      console.log('response:', response);
    } catch (error: unknown) {
      const apiArror = error as ApiError;
      showErrorToast(apiArror.message);
      console.error(apiArror);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto h-[calc(100vh-6rem)] w-full overflow-hidden px-4">
      {/* 상단 제목 */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">전처리 설정하기</h1>
        <h2>필요한 전처리 기능을 선택하고, 데이터를 다듬어주세요.</h2>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex h-[calc(100%-4.5rem)] gap-4 xl:flex-row xl:gap-6">
        {/* 좌측 영역 */}
        <div className="flex max-w-[20rem] min-w-[16rem] flex-col overflow-y-auto xl:basis-[20%]">
          {/* 프로젝트 정보 */}
          <div className="bg-[theme(primary-white)] mb-4 rounded-lg p-4">
            <h3 className="text-lg font-semibold">
              <span className="font-tossface">📌</span> {projectTitle}
            </h3>
          </div>

          {/* 전처리 기능 */}
          <div className="bg-[theme(primary-white)] flex flex-1 flex-col rounded-lg p-4">
            <h4 className="text-[1.07rem] font-semibold">전처리 기능 선택</h4>
            <div className="mt-4 mb-6 flex-1 overflow-y-auto">
              <PreprocessingOptions pipelineId={pipelineId} onChangeCells={handleChangeCells} onAddStep={handleAddStep} />
            </div>
            <div className="text-center text-xs">
              <span className="text-[var(--color-error-text)]">*</span> 추천 결과 적용 시 기본 설정값이 자동으로 입력됩니다.
            </div>
            <Button variant="black" size="lg" onClick={requestAISuggestion} className="mt-2 w-full">
              AI 추천 결과 적용하기
            </Button>
          </div>
        </div>

        {/* 우측 영역 */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 xl:basis-[80%]">
          {/* 데이터 요약 & 적용된 단계 */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="bg-[theme(primary-white)] rounded-md p-4 md:w-1/4">
              <h4 className="text-left text-[1.07rem] font-semibold">내 데이터 요약</h4>
              <p className="text-sm text-[var(--color-gray-01)]">전처리로 결측치와 이상치를 수정할 수 있습니다.</p>
              <PreprocessingSummary />
            </div>

            <div className="bg-[theme(primary-white)] overflow-x-auto rounded-md p-4 md:w-3/4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-left text-[1.07rem] font-semibold">AI 추천 전처리 단계</h4>
                  <p className="text-sm text-[var(--color-gray-01)]">AI가 추천하는 전처리 단계를 확인할 수 있습니다.</p>
                </div>
              </div>
              <PreprocessingPipeline steps={recommendedSteps} />
            </div>
          </div>

          <div className="bg-[theme(primary-white)] overflow-x-auto rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-left text-[1.07rem] font-semibold">적용한 전처리 단계</h4>
                <p className="text-sm text-[var(--color-gray-01)]">전처리 과정을 확인할 수 있습니다.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRemoveStep} disabled={steps.length === 0}>
                - 최근 단계 삭제
              </Button>
            </div>
            <PreprocessingPipeline steps={steps} />
          </div>
          {/* 데이터 미리보기 */}
          <div className="bg-[theme(primary-white)] overflow-x-auto rounded-md p-4">
            <h4 className="text-[1.07rem] font-semibold">데이터 미리보기</h4>
            <p className="text-sm text-[var(--color-gray-01)]">변경된 데이터는 하이라이트로 표시됩니다.</p>
            <PreprocessingTable changedCells={changedCells} />
          </div>

          {/* 전처리 완료 버튼 */}
          <div className="mt-auto">
            <Button variant="black" size="lg" className="w-full p-6" onClick={handleCompletePreprocessing} disabled={steps.length === 0}>
              전처리 결과 확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreprocessDataPage;
