'use client';

import { Button } from '@/components/ui/button';
import { ColumnConfig } from '@/entities/workspace/data-config/model/types';
import { aiRecommendedStepsAtom, completedDatasetAtom, pipelineIdAtom, preprocessErrorMsgAtom, preprocessingStepsAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { Step } from '@/entities/workspace/data-preprocess/model/types';
import { processClearSteps } from '@/entities/workspace/data-preprocess/utils/processClearSteps';
import { projectCategoryAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { guide } from '@/features/guide/GuideProvider';
import { registerPreprocessGuideSteps } from '@/features/guide/steps/registerPreprocessGuideSteps';
import { startGuide } from '@/features/guide/useGuide';
import EmptyDataAlertDialog from '@/features/workspace/data-preprocess/ui/EmptyDataAlertDialog';
import PreprocessDataSkeleton from '@/features/workspace/data-preprocess/ui/PreprocessDataSkeleton';
import PreprocessingConfirmDialog from '@/features/workspace/data-preprocess/ui/PreprocessingConfirmDialog';
import PreprocessingOptions from '@/features/workspace/data-preprocess/ui/PreprocessingOptions';
import PreprocessingPipeline from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';
import PreprocessingSummary from '@/features/workspace/data-preprocess/ui/PreprocessingSummary';
import PreprocessingTable from '@/features/workspace/data-preprocess/ui/PreprocessingTable';
import { uploadDataset } from '@/features/workspace/data-upload/service/uploadDataset';
import StepProgress from '@/features/workspace/ui/StepProgress';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { globalLoadingAtom, globalLoadingMessageAtom } from '@/shared/model/atoms/GlobalLoadingAtom';
import { AxiosError } from 'axios';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ApiError } from 'next/dist/server/api-utils';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PreprocessDataPage = () => {
  const router = useRouter();
  const [uploadedData, setUploadedData] = useAtom(uploadedDatasetAtom);
  const [pipelineId, setPipelineId] = useAtom(pipelineIdAtom);
  const [projectTitle, setProjectTitle] = useAtom(projectTitleAtom);
  const [isLoading, setIsLoading] = useAtom(globalLoadingAtom);
  const setLoadingMessage = useSetAtom(globalLoadingMessageAtom);
  const [changedCells, setChangedCells] = useState<Record<string, boolean>>({});
  const setCompletedDataset = useSetAtom(completedDatasetAtom);
  const [steps, setSteps] = useState<Step[]>([]);
  const [preprocessingSteps, setPreprocessingSteps] = useAtom(preprocessingStepsAtom);
  const recommendedSteps = useAtomValue(aiRecommendedStepsAtom);
  const setProjectCategory = useSetAtom(projectCategoryAtom);
  const [showEmptyDataAlert, setShowEmptyDataAlert] = useState(false);
  const [preprocesingErrorMsg, setPreprocesingErrorMsg] = useAtom(preprocessErrorMsgAtom);

  const reloadData = async (storedPipelineId: string) => {
    setIsLoading(true);
    setLoadingMessage('이전 데이터를 불러오고 있습니다.');
    try {
      const response = await axiosInstance(`/api/v2/pipelines/${storedPipelineId}/reload/preprocess`);
      // console.log('response:', response);

      const data = response.data.data;

      if (Array.isArray(data.dataset) && data.dataset.length === 0) {
        setShowEmptyDataAlert(true);
        return;
      }

      const columns = data.columns.map((col: ColumnConfig) => col.name);

      setPipelineId(data.pipelineId);
      setProjectTitle(data.title);
      setProjectCategory(data.category);
      setUploadedData({
        pipelineId: data.pipelineId,
        summary: data.summary,
        missingValues: data.summary.missingValues,
        originalDatasets: {
          data: data.dataset,
          columns: columns,
        },
      });
      setPreprocessingSteps(data.preprocessingSteps);
    } catch (error) {
      const apiError = error as ApiError;
      setShowEmptyDataAlert(true);
      console.error(apiError);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

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
      const stored = localStorage.getItem('pipelineId');
      // console.log('stored pipelineId:', stored);

      if (stored) {
        setPipelineId(stored);
        reloadData(stored);
      } else {
        showErrorToast('파이프라인 ID를 찾을 수 없습니다.');
        router.push('/workspace');
      }
    }
  }, [pipelineId, uploadedData]);

  useEffect(() => {
    if (preprocessingSteps && preprocessingSteps.length > 0) {
      setSteps(preprocessingSteps);
    }
  }, [preprocessingSteps]);

  const handleAddStep = (newStep: Step) => {
    setSteps((prev) => [...prev, newStep]);
  };

  const handleChangeCells = (newCells: Record<string, boolean>) => {
    setChangedCells(newCells);
  };

  const handleCompletePreprocessing = async () => {
    setIsLoading(true);
    setLoadingMessage('데이터 전처리 완료를 진행하고 있습니다.');
    try {
      const response = await axiosInstance.post(`/api/v2/pipelines/${pipelineId}/preprocessing/complete`);

      // console.log('response:', response);

      setCompletedDataset(response.data.data.data);
      setSteps([]);
      setPreprocessingSteps([]);
      setPreprocesingErrorMsg('');

      router.push('/workspace/data-preprocess/complete');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showErrorToast(apiError.message);
      console.error(apiError);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  const handleRemoveStep = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(`/api/v2/pipelines/${pipelineId}/preprocessing/delete`);

      setSteps((prev) => prev.slice(0, -1));

      // console.log('단계 삭제 response:', response);
      // console.log('response.data.data.datset', response.data.data.dataset);

      const data = response.data.data;
      // setUploadedData(response.data.data.dataset);
      setUploadedData({
        pipelineId: data.pipelineId,
        summary: {
          totalRows: data.summary.totalRows,
          totalColumns: data.summary.totalColumns,
        },
        missingValues: data.summary.missingValues,
        originalDatasets: data.originalDatasets,
      });
    } catch (error: unknown) {
      const apiArror = error as ApiError;
      showErrorToast(apiArror.message);
      setPreprocesingErrorMsg(apiArror.message);
      console.error(apiArror);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAllPreprocessingSteps = async (): Promise<string | null> => {
    // setIsLoading(true);
    // setLoadingMessage('전처리 단계를 일괄 적용 중입니다.');
    try {
      const processedSteps = recommendedSteps.map(processClearSteps);

      const payload = {
        steps: processedSteps,
      };

      const response = await axiosInstance.post(`/api/v2/pipelines/${pipelineId}/preprocessing/batch`, payload);

      // console.log('전처리 일괄 실행 결과:', response.data);
      const data = response.data.data.data;
      // console.log('data:', data);
      const firstData = data.dataset[0];
      // console.log('firstData:', firstData);

      const columns = Object.keys(firstData);
      // console.log('columns:', columns);

      setUploadedData({
        pipelineId: data.pipelineId,
        summary: {
          totalColumns: data.summary.total_columns,
          totalRows: data.summary.total_rows,
        },
        missingValues: data.summary.missingValues,
        originalDatasets: {
          data: data.dataset,
          columns: columns,
        },
      });
      setSteps(recommendedSteps);

      return null;
    } catch (error) {
      const axiosError = error as AxiosError<unknown>;
      console.error('전처리 일괄 실행 실패:', error);
      console.log('errorMsg:', axiosError?.response?.data);

      const data = axiosError?.response?.data as { error?: { message?: string } };
      const message = data?.error?.message ?? '전처리 실행 중 오류가 발생했습니다.';

      console.log('message:', message);

      return message;
    }
  };

  if (isLoading || !uploadDataset) {
    return <PreprocessDataSkeleton />;
  }

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
      <div className="mt-6 flex h-[calc(100%-4.5rem)] min-h-0 flex-col gap-2 xl:flex-row xl:gap-2">
        {/* 좌측 영역 */}
        <div className="flex max-h-[calc(100vh-15rem)] min-h-0 flex-col overflow-hidden xl:max-w-[20rem] xl:min-w-[16rem] xl:basis-[20%]">
          {/* 프로젝트 정보 */}
          <div className="bg-[theme(primary-white)] mb-2 rounded-lg p-4">
            <h3 className="text-md font-semibold">
              <span className="font-tossface">📌</span> {projectTitle}
            </h3>
          </div>

          {/* 전처리 기능 */}
          <div className="bg-[theme(primary-white)] flex flex-1 flex-col overflow-hidden rounded-lg p-4">
            <h4 className="text-[1.07rem] font-semibold">전처리 기능 선택</h4>
            <div className="preprocessing-options mt-4 mb-6 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <PreprocessingOptions pipelineId={pipelineId} onChangeCells={handleChangeCells} onAddStep={handleAddStep} />
              </div>
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
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold">AI 추천 전처리 단계</h4>
                  {/* <PreprocessingConfirmDialog steps={recommendedSteps} requestPreprocessing={requestAllPreprocessingSteps} /> */}
                </div>
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
                  {steps && steps.length > 0 && <p className="text-sm text-[var(--color-gray-01)]">현재 적용된 전처리 단계: {steps.filter(Boolean).length}단계</p>}{' '}
                </div>
                <Button variant="outline" size="sm" onClick={handleRemoveStep} disabled={steps.length === 0}>
                  - 최근 단계 삭제
                </Button>
              </div>
              <div className="mt-2 text-right">
                {preprocesingErrorMsg && (
                  <p className="text-sm text-[var(--color-error)]">
                    <span className="text-[var(--color-gray-01)]">에러 발생: </span>
                    {preprocesingErrorMsg}
                  </p>
                )}
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
      <EmptyDataAlertDialog open={showEmptyDataAlert} onOpenChange={setShowEmptyDataAlert} />
    </div>
  );
};

export default PreprocessDataPage;
