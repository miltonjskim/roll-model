'use client';

import { Button } from '@/components/ui/button';
import { pipelineIdAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { SampleDataset, SampleDatasetResponse, SampleDatasetUploadResponse } from '@/entities/workspace/data-selection/model/type';
import { projectCategoryAtom, projectDescriptionAtom, projectDomainAtom, projectIdAtom, projectPublicAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { SampleColumnModal } from '@/features/workspace/data-selection/ui/SampleColumnModal';
import { FileUploadDialog } from '@/features/workspace/data-upload/ui/FileUploadDialog';
import { createProject } from '@/features/workspace/service/createProject';
import StepProgress from '@/features/workspace/ui/StepProgress';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiError } from '@/shared/model/types/apiResponse';
import BackButton from '@/shared/ui/BackButton';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SelectDataPage = () => {
  const router = useRouter();
  const [showSampleMenu, setshowSampleMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [samples, setSamples] = useState<SampleDataset[]>([]);
  const [selectedSample, setSelectedSample] = useState<SampleDataset | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const setProjectId = useSetAtom(projectIdAtom);
  const projectTitle = useAtomValue(projectTitleAtom);
  const projectDescription = useAtomValue(projectDescriptionAtom);
  const projectCategory = useAtomValue(projectCategoryAtom);
  const projectDomain = useAtomValue(projectDomainAtom);
  const projectPublic = useAtomValue(projectPublicAtom);
  const setPipelineId = useSetAtom(pipelineIdAtom);
  const setUploadedDataset = useSetAtom(uploadedDatasetAtom);

  const fetchSampleDatasetList = async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/api/v2/datasets/samples`);
      console.log('response:', data);
      setSamples(data.data.samples);
      setshowSampleMenu(true);
    } catch (error) {
      const apiError = error as ApiError;
      showErrorToast(apiError.message);
      console.error(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (sampleId: number) => {
    const payload = {
      title: projectTitle,
      description: projectDescription,
      domain: projectDomain,
      type: projectCategory,
      isPublic: projectPublic,
    };
    try {
      const response = await createProject(payload);

      const projectId = response.data.id;
      setProjectId(projectId.toString());

      uploadSampleDataset(projectId, sampleId);
    } catch (err) {
      console.error('프로젝트 생성 실패:', err);
    }
  };

  const uploadSampleDataset = async (projectId: number, sampleId: number) => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post(`/api/v2/projects/${projectId}/datasets/samples/${sampleId}`);

      const sampleDataResponse: SampleDatasetUploadResponse = data.data.result;
      console.log('sampleDataResponse:', sampleDataResponse);

      const pipelineId = sampleDataResponse.pipelineId;

      setUploadedDataset({
        pipelineId: pipelineId,
        summary: sampleDataResponse.summary,
        missingValues: sampleDataResponse.missingValues,
        originalDatasets: sampleDataResponse.originalDatasets,
      });

      setPipelineId(pipelineId);

      router.push('/workspace/data-preprocess');
    } catch (error) {
      const apiError = error as ApiError;
      showErrorToast(apiError.message);
      console.error(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSampleData = () => {
    fetchSampleDatasetList();
  };

  const handleSelectSample = (dataset: SampleDataset) => {
    const sampleId = dataset.id;
    handleCreateProject(sampleId);
  };

  const regressionSamples = samples.filter((s) => s.category === 'REGRESSION');
  const classificationSamples = samples.filter((s) => s.category === 'CLASSIFICATION');

  const handlePreviewColumns = (sample: SampleDataset) => {
    setSelectedSample(sample);
    setShowPreviewModal(true);
  };

  return (
    <div>
      <div className="mx-auto flex max-w-[70%] items-center justify-between">
        <div className="text-left select-none">
          <h1 className="text-xl font-bold">3. 프로젝트 데이터 선택</h1>
          <h2>데이터를 선택해 주세요</h2>
        </div>
        <StepProgress />
      </div>

      <div className="mx-auto mt-8 max-w-[70rem] select-none">
        <div className="bg-[theme(primary-white)] flex h-120 justify-center gap-4 rounded-lg p-4">
          <FileUploadDialog />
          <div
            className="h-full flex-1/2 cursor-pointer rounded-lg border border-[var(--color-gray-03)]"
            onClick={(e) => {
              e.stopPropagation();
              handleUseSampleData();
            }}
          >
            {showSampleMenu ? (
              <div className="flex h-full flex-col overflow-y-auto p-2">
                <h3 className="pb-2 text-base font-semibold">📊 샘플 데이터 선택</h3>

                <div>
                  <h4 className="mt-2 text-sm font-bold">📈 회귀</h4>
                  {regressionSamples.map((sample) => (
                    <div key={sample.id} className="mt-2 cursor-pointer rounded-md border border-gray-200 p-3">
                      <p className="text-sm font-medium">{sample.name}</p>
                      <p className="text-xs text-gray-500">{sample.description}</p>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewColumns(sample);
                          }}
                        >
                          컬럼 미리보기
                        </Button>
                        <Button
                          variant="black"
                          size="sm"
                          className="mt-2 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSample(sample);
                          }}
                        >
                          선택
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="mt-4 text-sm font-bold">🧮 분류</h4>
                  {classificationSamples.map((sample) => (
                    <div key={sample.id} className="mt-2 cursor-pointer rounded-md border border-gray-200 p-3">
                      <p className="text-sm font-medium">{sample.name}</p>
                      <p className="text-xs text-gray-500">{sample.description}</p>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewColumns(sample);
                          }}
                        >
                          컬럼 미리보기
                        </Button>
                        <Button
                          variant="black"
                          size="sm"
                          className="mt-2 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSample(sample);
                          }}
                        >
                          선택
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full cursor-pointer items-center justify-center" onClick={fetchSampleDatasetList}>
                <p className="text-md font-semibold">
                  <span className="font-tossface mr-2">📊</span>샘플 데이터 사용하기
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <SampleColumnModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        dataset={selectedSample}
        onSelect={(dataset) => {
          handleSelectSample(dataset);
          setShowPreviewModal(false);
        }}
      />

      <BackButton size="lg" className="mt-4 w-70">
        이전 단계로
      </BackButton>
    </div>
  );
};

export default SelectDataPage;
