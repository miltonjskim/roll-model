'use client';

import ParameterSectionWidget from '@/widgets/workspace/modeling-section/ParameterSectionWidget';
import ModelSelectionWidget from '@/widgets/workspace/modeling-section/ModelSelectionWidget';
import { TARGET_VARIABLES } from '@/shared/api/mocks/modeling/modelingData';
import { useModeling } from './model/useModeling';
import { useAtomValue } from 'jotai';
import { completedDatasetAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';

export default function ModelingPage() {
  const {
    models,
    selectedModelId,
    targetVariable,
    parameterValues,
    dataSplit,
    isLoading,
    selectedModel,
    modelCategory,

    setTargetVariable,
    setDataSplit,
    handleParameterChange,
    handleModelSelect,
    handleStartTraining,
  } = useModeling();

  // 전처리된 데이터 컬럼
  const completedUploadset = useAtomValue(completedDatasetAtom);

  // 파이프라인 아이디
  const uploadedData = useAtomValue(uploadedDatasetAtom);
  const pipelineId = uploadedData?.pipelineId;

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-4 text-center text-2xl font-bold">프로젝트 모델 선택</h1>
      <p className="mb-8 text-center">모델을 선택해주세요.</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 왼쪽: 파라미터 설정 */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-primary)] p-6 text-[var(--color-primary-foreground)]">
          <ParameterSectionWidget
            targetVariables={TARGET_VARIABLES}
            selectedTargetVariable={targetVariable}
            onTargetVariableChange={setTargetVariable}
            selectedModel={selectedModel}
            parameterValues={parameterValues}
            onParameterChange={handleParameterChange}
            dataSplit={dataSplit}
            onDataSplitChange={setDataSplit}
          />
        </div>

        {/* 오른쪽: 모델 선택 */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <ModelSelectionWidget models={models} selectedModelId={selectedModelId} onModelSelect={handleModelSelect} modelCategory={modelCategory} />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          className={`rounded-full bg-[var(--color-primary)] px-8 py-3 font-bold text-[var(--color-primary-foreground)] transition ${isLoading ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90'}`}
          onClick={handleStartTraining}
          disabled={isLoading}
        >
          {isLoading ? '학습 시작 중...' : '학습 시작하기'}
        </button>
      </div>
      <div></div>
    </div>
  );
}
