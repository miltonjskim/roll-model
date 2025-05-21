'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { pipelineIdAtom, preprocessingStepsAtom, selectedSampleDataIdAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { SampleDatasetUploadResponse } from '@/entities/workspace/data-selection/model/type';
import { projectCategoryAtom, projectDescriptionAtom, projectDomainAtom, projectIdAtom, projectPublicAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { projectCategory, projectDomain } from '@/entities/workspace/model/types';
import { guide } from '@/features/guide/GuideProvider';
import { registerMetaDataGuideSteps } from '@/features/guide/steps/registerMetaDataGuideSteps';
import { startGuide } from '@/features/guide/useGuide';
import { CATEGORY_OPTIONS, DOMAIN_OPTIONS } from '@/features/workspace/constants/selectOptions';
import { uploadDataset } from '@/features/workspace/data-upload/service/uploadDataset';
import { createProject } from '@/features/workspace/service/createProject';
import StepProgress from '@/features/workspace/ui/StepProgress';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { globalLoadingAtom, globalLoadingMessageAtom } from '@/shared/model/atoms/GlobalLoadingAtom';
import BackButton from '@/shared/ui/BackButton';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const InputProjectMetaDataPage = () => {
  const router = useRouter();

  const [title, setTitle] = useAtom(projectTitleAtom);
  const [description, setDescription] = useAtom(projectDescriptionAtom);
  const [domain, setDomain] = useAtom(projectDomainAtom);
  const [type, setType] = useAtom(projectCategoryAtom);
  const [isPublic, setIsPublic] = useAtom(projectPublicAtom);
  const setProjectId = useSetAtom(projectIdAtom);
  const [selectedSampleDataId, setSelectedSampleDataId] = useAtom(selectedSampleDataIdAtom);
  const setIsLoading = useSetAtom(globalLoadingAtom);
  const setLoadingMessage = useSetAtom(globalLoadingMessageAtom);
  const setPreprocessingSteps = useSetAtom(preprocessingStepsAtom);
  const setUploadedDataset = useSetAtom(uploadedDatasetAtom);
  const setPipelineId = useSetAtom(pipelineIdAtom);

  useEffect(() => {
    // 페이지 최초 진입 시만 초기화
    const dismissed = localStorage.getItem('guide.dismissed') === 'true';

    if (!dismissed) {
      guide.cancel();
      guide.steps = [];
      registerMetaDataGuideSteps();
      startGuide();
    }
  }, [setTitle, setDescription, setDomain, setType, setIsPublic]);

  // 샘플 데이터셋 업로드 함수
  const uploadSampleDataset = async (projectId: number, sampleId: number): Promise<boolean> => {
    setIsLoading(true);
    setLoadingMessage('샘플 데이터셋을 업로드하고 있습니다.');
    try {
      const { data } = await axiosInstance.post(`/api/v2/projects/${projectId}/datasets/samples/${sampleId}`);

      const sampleDataResponse: SampleDatasetUploadResponse = data.data.result;
      // console.log('sampleDataResponse:', sampleDataResponse);

      const pipelineId = sampleDataResponse.pipelineId;
      // console.log('pipelineId:', pipelineId);

      setUploadedDataset({
        pipelineId: pipelineId,
        summary: sampleDataResponse.summary,
        missingValues: sampleDataResponse.missingValues,
        originalDatasets: sampleDataResponse.originalDatasets,
      });

      localStorage.setItem('pipelineId', pipelineId);
      setPipelineId(pipelineId);
      setSelectedSampleDataId(0);

      return true;
    } catch (err) {
      showErrorToast((err as Error).message);
      console.error(err);
      setIsLoading(false);
      setLoadingMessage(null);

      return false;
    }
  };

  const handleCreateProject = async () => {
    setIsLoading(true);
    setLoadingMessage('프로젝트를 생성하고 있습니다...');

    const payload = {
      title: title,
      description: description,
      domain: domain,
      type: type,
      isPublic: isPublic,
    };

    try {
      const response = await createProject(payload);
      const projectId = response.data.id;
      setProjectId(projectId.toString());
      setLoadingMessage('데이터셋을 업로드하고 분석하고 있어요.');
      setPreprocessingSteps([]);

      const success = await uploadSampleDataset(projectId, selectedSampleDataId);
      if (success) {
        router.push('/workspace/data-preprocess');
      }
    } catch (err) {
      showErrorToast('프로젝트 생성에 실패했습니다.');
      console.error('프로젝트 생성 실패:', err);
      setIsLoading(false);
      setLoadingMessage(null);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  const handleSubmit = () => {
    if (selectedSampleDataId === 0) {
      router.push('/workspace/data-config');
      return;
    }

    handleCreateProject();
  };

  return (
    <div className="mx-auto max-w-[90%]">
      <div className="mx-auto flex max-w-[70%] items-center justify-between">
        <div className="text-left select-none">
          <h1 className="text-xl font-bold">3. 프로젝트 메타데이터 입력</h1>
          <h2>프로젝트 정보를 입력해 주세요.</h2>
        </div>
        <StepProgress />
      </div>

      <div className="bg-[theme(primary-white)] mx-auto mt-8 flex max-w-[70%] min-w-[44rem] flex-col justify-between gap-12 rounded-lg px-6 pt-8 pb-6 text-left">
        <div className="my-auto flex flex-col justify-center gap-8">
          <div className="guide-project-title flex items-center gap-2">
            <label htmlFor="project-name" className="flex-1/5 font-semibold select-none">
              프로젝트 이름
            </label>
            <Input
              type="text"
              value={title}
              id="project-name"
              placeholder="프로젝트 이름은 필수 입력 값입니다."
              onChange={(e) => setTitle(e.target.value)}
              className="flex-4/5 font-medium select-none"
              required
            />
          </div>

          <div className="guide-project-description flex items-center gap-2 select-none">
            <label htmlFor="project-description" className="flex-1/5 font-semibold">
              프로젝트 목적
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예측하고자 하는 것(목표 변수)을 입력해주세요."
              className="flex-4/5 font-medium"
              id="project-description"
              required
            />
          </div>

          <div className="guide-project-domain flex items-center gap-2 select-none">
            <label htmlFor="project-domain" className="flex-1/5 font-semibold">
              도메인 선택
            </label>
            <Select value={domain} onValueChange={(val) => setDomain(val as projectDomain)} required>
              <SelectTrigger className="flex-4/5 font-medium">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {DOMAIN_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="guide-project-type flex items-center gap-2 select-none">
            <label htmlFor="project-category" className="flex-1/5 font-semibold">
              예측 방식 선택
            </label>
            <Select value={type} onValueChange={(val) => setType(val as projectCategory)} required>
              <SelectTrigger className="flex-4/5 font-medium">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="guide-project-public flex gap-2 select-none">
            <label htmlFor="project-public" className="flex-1/5 font-semibold">
              프로젝트 공개 여부
            </label>
            <RadioGroup value={isPublic ? 'true' : 'false'} onValueChange={(value) => setIsPublic(value === 'true')} className="flex flex-4/5 gap-6 text-sm font-medium">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="public" />
                <label htmlFor="public">공개</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="private" />
                <label htmlFor="private">비공개</label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="flex gap-2">
          <BackButton variant="outline" size="lg" className="flex-1">
            이전 단계로
          </BackButton>
          <Button variant="black" className="flex-1" onClick={handleSubmit} size="lg">
            다음 단계로
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputProjectMetaDataPage;
