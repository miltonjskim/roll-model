'use client';

import { useProjectDetailModel } from '@/app/project-detail/[id]/modeling-section/model/useProjectDetailModel';
import { ClassificationModelData, RegressionModelData } from '@/entities/project-detail/model/ModelTypes';
import { MODEL_NAME_MAPPING } from '@/shared/api/mocks/modeling/modelingData';
import { useParams } from 'next/navigation';

export default function ModelSectionPage() {
  const { id } = useParams();
  const pipelineId = id as string;

  const { projectDetailModel, isLoading, isError, isClassification, isRegression } = useProjectDetailModel(pipelineId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !projectDetailModel) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">데이터를 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.</div>;
  }

  // 모델명 한글 변환
  const algorithmName = projectDetailModel.algorithm;
  const koreanModelName = MODEL_NAME_MAPPING[algorithmName as keyof typeof MODEL_NAME_MAPPING] || algorithmName;

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">모델 상세 정보</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">기본 정보</h2>
        <p>모델 유형: {isClassification ? '분류 모델' : isRegression ? '회귀 모델' : '알 수 없음'}</p>
        <p>모델 제목: {projectDetailModel.projectInfo.title}</p>
        <p>알고리즘: {projectDetailModel.algorithm}</p>
        <p>알고리즘: {koreanModelName}</p>
      </div>

      {/* 모델 타입에 따른 조건부 렌더링 */}
      {isClassification && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">분류 모델 정보</h2>
          <p>
            혼동 행렬 크기: {(projectDetailModel as ClassificationModelData).confusionMatrix.matrixData.length}x{(projectDetailModel as ClassificationModelData).confusionMatrix.matrixData[0].length}
          </p>
        </div>
      )}

      {isRegression && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">회귀 모델 정보</h2>
          <p>데이터 포인트 수: {(projectDetailModel as RegressionModelData).actualVsPredicted.data.length}</p>
        </div>
      )}

      {/* 전체 응답 데이터 출력 (디버깅용) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">전체 응답 데이터 (디버깅용)</h2>
        <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-gray-100 p-4">{JSON.stringify(projectDetailModel, null, 2)}</pre>
      </div>
    </div>
  );
}
