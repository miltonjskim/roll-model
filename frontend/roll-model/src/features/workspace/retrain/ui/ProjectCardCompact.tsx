import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { getRelativeTime } from '@/shared/lib/utils/dateUtils';
import { Project } from '@/entities/dashboard/model/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useAtom, useSetAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { projectCategoryAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { ApiError, ApiResponse } from '@/shared/model/types/apiResponse';
import { ForkPreprocessResponse, ForkTotalResponse } from '@/shared/model/types/modelingTypes';
import { useState } from 'react';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { dataColumnsAtom, pipelineIdAtom, preprocessingStepsAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { uploadDataset } from '@/features/workspace/data-upload/service/uploadDataset';
import { globalLoadingAtom, globalLoadingMessageAtom } from '@/shared/model/atoms/GlobalLoadingAtom';

interface ProjectCardCompactProps {
  project: Project;
}

export const ProjectCardCompact = ({ project }: ProjectCardCompactProps) => {
  const router = useRouter();
  const setProjectDetail = useSetAtom(projectDetailAtom);
  const setProjectCategory = useSetAtom(projectCategoryAtom);
  const setIsLoading = useSetAtom(globalLoadingAtom);
  const setLoadingMessage = useSetAtom(globalLoadingMessageAtom);
  const setPipelineId = useSetAtom(pipelineIdAtom);
  const setProjectTitle = useSetAtom(projectTitleAtom);
  const setDataColumns = useSetAtom(dataColumnsAtom);
  const setUploadDataset = useSetAtom(uploadedDatasetAtom);
  const setPreprocessingSteps = useSetAtom(preprocessingStepsAtom);

  const moveToPreprocessing = async () => {
    setIsLoading(true);
    setLoadingMessage('전처리 단계로 재학습하기 위해 파이프라인을 생성중입니다.');
    try {
      const response = await axiosInstance.post<ApiResponse<ForkPreprocessResponse>>(`/api/v2/pipelines/${project.id}/fork/preprocess`);

      const data = response.data.data;
      console.log('data:', data);

      const columns = data.columns;
      const columnNames = columns.map((col) => col.name);

      setPipelineId(data.pipelineId);
      localStorage.setItem('pipelineId', data.pipelineId);
      setProjectTitle(project.title);
      setUploadDataset({
        pipelineId: data.pipelineId,
        summary: data.summary,
        missingValues: data.summary.missingValues,
        originalDatasets: {
          columns: columnNames,
          data: data.dataset,
        },
      });
      setPreprocessingSteps(data.preprocessingSteps);

      router.push('/workspace/data-preprocess');
    } catch (error) {
      showErrorToast((error as ApiError).message);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  const moveToModeling = async () => {
    setIsLoading(true);
    setLoadingMessage('모델링 단계로 재학습하기 위해 파이프라인을 생성중입니다.');
    try {
      const response = await axiosInstance.post<ApiResponse<ForkTotalResponse>>(`/api/v2/pipelines/${project.id}/fork/total`);

      const data = response.data.data;

      setProjectDetail({
        id: data.pipelineId,
        title: project.title,
        version: project.version,
        category: data.category,
        domain: project.domain,
        projectPublicYn: project.publicYn,
        ownerYn: false,
      });

      setProjectCategory(data.category);
      setDataColumns(data.columns);
      router.push('/workspace/modeling-section');
    } catch (error) {
      showErrorToast((error as ApiError).message);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-gray-03)] bg-white p-4 shadow-sm transition-shadow select-none hover:shadow-md">
      <div className="mb-2">
        <h2 className="truncate text-lg font-bold text-gray-900">{project.title}</h2>
        <p className="text-xs text-gray-400">{getRelativeTime(project.updatedAt)} 수정됨</p>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <p>타입: {project.category === 'CLASSIFICATION' ? '분류' : '회귀'}</p>
        <p>도메인: {project.displayDomain || getDomainDisplayName(project.domain)}</p>
        <p>목표변수: {project.target ? project.target : '없음'}</p>
        <p>데이터 수: {project.dataCount.toLocaleString()}</p>
        <p>버전: {project.version ? project.version : '0.0'}</p>
        <p>학습시간: {project.runningDuration !== undefined && project.runningDuration !== null ? project.runningDuration.toString() : 'N/A'}</p>

        {project.category === 'CLASSIFICATION' ? (
          <p>정확도: {project.accuracy != null ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(project.accuracy * 100)}%` : '학습대기중'}</p>
        ) : (
          <p>
            정확도 (R²):{' '}
            {project.rSquared != null
              ? `${new Intl.NumberFormat('en-US', {
                  maximumFractionDigits: 2,
                }).format(project.rSquared * 100)}%`
              : '학습대기중'}
          </p>
        )}
      </div>
      <div className="mt-3">
        {project.status === 'COMPLETED' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                재학습 방법을 선택하세요
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={moveToPreprocessing}>전처리부터 다시하기</DropdownMenuItem>
              <DropdownMenuItem onClick={moveToModeling}>모델링 다시하기</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={moveToModeling}>
            모델 학습으로 이동
          </Button>
        )}
      </div>
    </div>
  );
};
