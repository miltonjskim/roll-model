'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiRecommendedStepsAtom, completedDatasetAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { Step } from '@/entities/workspace/data-preprocess/model/types';
import { projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { guide } from '@/features/guide/GuideProvider';
import { registerPreprocessGuideSteps } from '@/features/guide/steps/registerPreprocessGuideSteps';
import { startGuide } from '@/features/guide/useGuide';
import PreprocessingInfoDialog from '@/features/workspace/data-preprocess/ui/PreprocessingInfoDialog';
import PreprocessingOptions from '@/features/workspace/data-preprocess/ui/PreprocessingOptions';
import PreprocessingPipeline from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';
import PreprocessingSummary from '@/features/workspace/data-preprocess/ui/PreprocessingSummary';
import PreprocessingTable from '@/features/workspace/data-preprocess/ui/PreprocessingTable';
import StepProgress from '@/features/workspace/ui/StepProgress';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { globalLoadingAtom } from '@/shared/model/atoms/GlobalLoadingAtom';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ApiError } from 'next/dist/server/api-utils';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PreprocessDataPage = () => {
  const router = useRouter();
  const [uploadedData, setUploadedData] = useAtom(uploadedDatasetAtom);
  const pipelineId = uploadedData?.pipelineId;
  const projectTitle = useAtomValue(projectTitleAtom);
  const setIsLoading = useSetAtom(globalLoadingAtom);
  const [changedCells, setChangedCells] = useState<Record<string, boolean>>({});
  const setCompletedDataset = useSetAtom(completedDatasetAtom);
  const [steps, setSteps] = useState<Step[]>([]);
  const recommendedSteps = useAtomValue(aiRecommendedStepsAtom);

  useEffect(() => {
    const dismissed = localStorage.getItem('guide.dismissed') === 'true';

    if (!dismissed) {
      guide.cancel();
      guide.steps = [];
      registerPreprocessGuideSteps();
      startGuide();
    }
  }, []);

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
      console.log('uploadedData:', uploadedData);
      // console.log('recommededSteps:', recommendedSteps);
    }
  }, [uploadedData, router]);

  const handleAddStep = (newStep: Step) => {
    setSteps((prev) => [...prev, newStep]);
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

      console.log('단계 삭제 response:', response);
      setUploadedData(response.data.data.dataset);
    } catch (error: unknown) {
      const apiArror = error as ApiError;
      showErrorToast(apiArror.message);
      console.error(apiArror);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full overflow-y-auto px-4 pb-4">
      {/* 상단 제목 */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-lg font-bold">5. 전처리 설정하기</h1>
          <h2 className="mt-[-0.4rem] text-base">필요한 전처리 기능을 선택하고, 데이터를 다듬어주세요.</h2>
        </div>
        <StepProgress />
      </div>

      {/* 콘텐츠 영역 */}
      <div className="mt-6 flex h-[calc(100%-4.5rem)] flex-col gap-2 xl:flex-row xl:gap-2">
        {/* 좌측 영역 */}
        <div className="flex max-h-full min-h-0 flex-col xl:max-w-[20rem] xl:min-w-[16rem] xl:basis-[20%]">
          {/* 프로젝트 정보 */}
          <div className="bg-[theme(primary-white)] mb-2 rounded-lg p-4">
            <h3 className="text-md font-semibold">
              <span className="font-tossface">📌</span> {projectTitle}
            </h3>
          </div>

          {/* 전처리 기능 */}
          <div className="bg-[theme(primary-white)] flex flex-1 flex-col overflow-hidden rounded-lg p-4">
            <h4 className="text-[1.07rem] font-semibold">전처리 기능 선택</h4>
            <div className="preprocessing-options preprocessing-options mt-4 mb-6 min-h-0 flex-1 overflow-y-auto">
              <PreprocessingOptions pipelineId={pipelineId} onChangeCells={handleChangeCells} onAddStep={handleAddStep} />
            </div>
            <div className="text-center text-xs">
              <span className="text-[var(--color-error-text)]">*</span> 결측 컬럼 상세 정보를 보시려면 아래를 클릭하세요.
            </div>
            <div className="data-summary-area">
              <PreprocessingSummary />
            </div>
          </div>
        </div>

        {/* 우측 영역 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {/* 추천 단계 + 데이터 미리보기 */}
            <div className="flex min-h-0 flex-[5] flex-col gap-2 md:flex-row">
              {/* AI 추천 단계: 가장 작게 (1 비율) */}
              <div className="bg-[theme(primary-white)] ai-recommended-section ai-recommended-section min-h-0 flex-[1] overflow-y-auto rounded-md p-4 pb-0 md:w-1/4">
                <h4 className="text-base font-semibold">AI 추천 전처리 단계</h4>
                <PreprocessingPipeline steps={recommendedSteps} cardStyle="small" highlight="gray" />
              </div>

              {/* 데이터 미리보기: 가장 크게 (3 비율) */}
              <div className="bg-[theme(primary-white)] preprocessing-table min-h-0 flex-[3] overflow-y-auto rounded-md p-4">
                <h4 className="text-[1.07rem] font-semibold">데이터 미리보기</h4>
                <p className="text-sm text-[var(--color-gray-01)]">변경된 데이터는 하이라이트로 표시됩니다.</p>
                <PreprocessingTable changedCells={changedCells} />
              </div>
            </div>

            {/* 적용한 전처리 단계: 중간 크기 (2 비율) */}
            <div className="bg-[theme(primary-white)] applied-steps min-h-0 flex-[2] overflow-y-auto rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-left text-base font-semibold">적용한 전처리 단계</h4>
                  <p className="text-sm text-[var(--color-gray-01)]">전처리 과정을 확인할 수 있습니다.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRemoveStep} disabled={steps.length === 0}>
                  - 최근 단계 삭제
                </Button>
              </div>
              <PreprocessingPipeline steps={steps} cardStyle="large" highlight="blue" />
            </div>
          </div>

          {/* 완료 버튼 */}
          <div className="complete-button mt-2">
            <Button variant="black" size="lg" className="w-full p-6 text-base" onClick={handleCompletePreprocessing} disabled={steps.length === 0}>
              전처리 결과 확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreprocessDataPage;
