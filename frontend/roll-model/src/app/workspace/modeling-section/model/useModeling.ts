'use client';

import { useEffect, useState } from 'react';
import { Model, ModelCategory, ParameterValues, ParameterValue } from '@/entities/workspace/modeling-section/model/types';
import { CLASSIFICATION_MODELS, REGRESSION_MODELS } from '@/shared/api/mocks/modeling/modelingData';
import { startModelTraining } from '@/shared/api/modelingApi';
import { useAtomValue } from 'jotai';
import { dataColumnsAtom, pipelineIdAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { projectCategoryAtom } from '@/entities/workspace/model/projectAtoms';
import { useRouter } from 'next/navigation';

export const useModeling = () => {
  const router = useRouter();
  const projectDetail = useAtomValue(pipelineIdAtom); // 파이프라인아이디
  const initialCategory = useAtomValue(projectCategoryAtom); // 카테고리 (분류 또는 회귀)
  const [modelCategory] = useState<ModelCategory>(initialCategory);
  const models = modelCategory === 'CLASSIFICATION' ? CLASSIFICATION_MODELS : REGRESSION_MODELS; // 카테고리에 맞는 모델리스트
  const dataColumns = useAtomValue(dataColumnsAtom); // 변수리스트
  const TARGET_VARIABLES = dataColumns.map((column) => column.name); // 변수이름리스트

  const [selectedModelId, setSelectedModelId] = useState(''); // 선택모델
  const [targetVariable, setTargetVariable] = useState(''); // 선택 목표변수
  const [parameterValues, setParameterValues] = useState<ParameterValues>({}); // 선택파라미터
  const [dataSplit, setDataSplit] = useState(70); // 선택 분할비율
  const [isLoading, setIsLoading] = useState(false);

  const selectedModel = models.find((model) => model.id === selectedModelId); // 모델리스트로부터 선택모델정보 불러옴

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

  // 학습 시작 핸들러 alert제거해
  const handleStartTraining = async () => {
    if (!selectedModelId || !targetVariable) {
      alert('모델과 목표 변수를 선택해주세요.');
      return;
    }

    // 필수 파라미터 확인 alert제거해
    const missingRequiredParams = selectedModel?.parameters.filter((param) => param.required && !parameterValues[param.id]).map((param) => param.name);
    if (missingRequiredParams && missingRequiredParams.length > 0) {
      alert(`필수 파라미터를 입력해주세요: ${missingRequiredParams.join(', ')}`);
      return;
    }

    try {
      setIsLoading(true);

      // 데이터 분할 비율 계산 (소수점 한 자리로 제한)
      const trainRatio = parseFloat((dataSplit / 100).toFixed(1));
      const testRatio = parseFloat((1 - trainRatio).toFixed(1));

      // API 요청 데이터 구성
      const requestData = {
        modelingInfo: {
          algorithm: selectedModelId,
          dataSplit: {
            trainRatio: trainRatio,
            testRatio: testRatio,
            validationRatio: 0,
            randomSeed: 42,
          },
          parameters: parameterValues,
          targetFeature: targetVariable,
        },
      };

      console.log('학습 시작 요청 데이터:', requestData); // 요청데이터 확인
      const response = await startModelTraining(projectDetail, requestData); // 요청 ㄱ
      console.log('학습 시작 응답:', response); // 응답데이터 확인

      localStorage.setItem(`modelTrainingStatus`, 'LEARNING'); // 학습중 상태로 전환 (고양이)
      alert('모델 학습이 시작되었습니다!'); // alert제거해
      router.push('/dashboard'); // 우선 대시보드 보내기
    } catch (error) {
      console.error('학습 시작 오류:', error);
      alert('모델 학습 시작 중 오류가 발생했습니다. 다시 시도해주세요.');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // 뭔가 필요한 정보가 하나라도 없다면 대시보드 보냄 (새로고침해서 상태 초기화 되었을때도 보냄)
  useEffect(() => {
    if (!dataColumns || !dataColumns.length || !projectDetail || !initialCategory) {
      router.push('/dashboard');
    }
  }, [dataColumns, projectDetail, initialCategory, router]);

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
