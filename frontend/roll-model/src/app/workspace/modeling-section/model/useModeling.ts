'use client';

import { useState } from 'react';
import { Model, ModelCategory, ParameterValues, ParameterValue } from '@/entities/workspace/modeling-section/model/types';
import { CLASSIFICATION_MODELS, REGRESSION_MODELS } from '@/shared/api/mocks/modeling/modelingData';
import { startModelTraining } from '@/shared/api/modelingApi';
import { useAtomValue } from 'jotai';
import { completedDatasetAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { projectCategoryAtom } from '@/entities/workspace/model/projectAtoms';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';

export const useModeling = () => {
  const projectDetail = useAtomValue(projectDetailAtom);
  // 모델 카테고리 (분류 또는 회귀)
  const initialCategory = useAtomValue(projectCategoryAtom);
  const [modelCategory] = useState<ModelCategory>(initialCategory);
  const models = modelCategory === 'CLASSIFICATION' ? CLASSIFICATION_MODELS : REGRESSION_MODELS;

  // 파이프라인 아이디
  const uploadedData = useAtomValue(uploadedDatasetAtom);
  const completedUploadset = useAtomValue(completedDatasetAtom);
  const PIPELINE_ID = uploadedData?.pipelineId || completedUploadset?.pipelineId || projectDetail.id;

  const TARGET_VARIABLES = completedUploadset ? completedUploadset.columns.map((col) => col.name) : [];

  // 상태 관리
  const [selectedModelId, setSelectedModelId] = useState('');
  const [targetVariable, setTargetVariable] = useState('');
  const [parameterValues, setParameterValues] = useState<ParameterValues>({});
  const [dataSplit, setDataSplit] = useState(70); // 기본값 70%
  const [isLoading, setIsLoading] = useState(false);

  // 선택된 모델 찾기
  const selectedModel = models.find((model) => model.id === selectedModelId);

  // 파라미터 값 변경 핸들러
  const handleParameterChange = (paramId: string, value: ParameterValue) => {
    setParameterValues((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  };

  // 모델 선택 핸들러
  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    // 모델 변경 시 파라미터 값 초기화
    const newModel = models.find((m) => m.id === modelId);
    if (newModel) {
      const initialValues: ParameterValues = {};
      newModel.parameters.forEach((param) => {
        initialValues[param.id] = param.defaultValue;
      });
      setParameterValues(initialValues);
    }
  };

  // 학습 시작 핸들러
  const handleStartTraining = async () => {
    if (!selectedModelId || !targetVariable) {
      alert('모델과 목표 변수를 선택해주세요.');
      return;
    }

    // 필수 파라미터 확인
    const missingRequiredParams = selectedModel?.parameters.filter((param) => param.required && !parameterValues[param.id]).map((param) => param.name);

    if (missingRequiredParams && missingRequiredParams.length > 0) {
      alert(`필수 파라미터를 입력해주세요: ${missingRequiredParams.join(', ')}`);
      return;
    }

    try {
      setIsLoading(true);

      // 트레인 비율 계산 (소수점 한 자리로 제한)
      const trainRatio = parseFloat((dataSplit / 100).toFixed(1));
      const testRatio = parseFloat((1 - trainRatio).toFixed(1));

      // API 요청 데이터 구성
      const requestData = {
        modelingInfo: {
          algorithm: selectedModelId, // modelType 대신 algorithm으로 변경
          dataSplit: {
            trainRatio: trainRatio,
            testRatio: testRatio,
            validationRatio: 0,
            randomSeed: 42,
          },
          parameters: parameterValues,
          targetFeature: targetVariable, // targetColumn 대신 targetFeature로 변경
        },
      };

      console.log('학습 시작 요청 데이터:', requestData);

      // API 호출 - pipelineId를 별도로 전달
      const response = await startModelTraining(PIPELINE_ID, requestData);
      console.log('학습 시작 응답:', response);
      localStorage.setItem(`modelTrainingStatus`, 'LEARNING');

      // 성공 알림
      alert('모델 학습이 시작되었습니다!');

      // 여기에 성공 후 리디렉션 또는 다음 단계로 이동하는 로직을 추가할 수 있습니다.
    } catch (error) {
      console.error('학습 시작 오류:', error);
      alert('모델 학습 시작 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    modelCategory,
    models,
    selectedModelId,
    targetVariable,
    parameterValues,
    dataSplit,
    isLoading,
    selectedModel,
    TARGET_VARIABLES,

    setTargetVariable,
    setDataSplit,
    handleParameterChange,
    handleModelSelect,
    handleStartTraining,
  };
};
