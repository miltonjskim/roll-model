'use client';

import { Model, Parameter, ParameterValues, ParameterValue } from '@/entities/workspace/modeling-section/model/types';
import TargetVariableSelector from '@/entities/workspace/modeling-section/ui/TargetVariableSelector';
import SliderParameter from '@/entities/workspace/modeling-section/ui/SliderParameter';
import RadioParameter from '@/entities/workspace/modeling-section/ui/RadioParameter';
import GammaParameter from '@/entities/workspace/modeling-section/ui/GammaParameter';
import DataSplitControl from '@/entities/workspace/modeling-section/ui/DataSplitControl';
import { getParameterEmoji } from '@/shared/api/mocks/modeling/modelingEmoji';

interface ParameterSectionWidgetProps {
  targetVariables: string[];
  selectedTargetVariable: string;
  onTargetVariableChange: (variable: string) => void;
  selectedModel: Model | undefined;
  parameterValues: ParameterValues;
  onParameterChange: (paramId: string, value: ParameterValue) => void;
  dataSplit: number;
  onDataSplitChange: (value: number) => void;
}

const ParameterSectionWidget = ({
  targetVariables,
  selectedTargetVariable,
  onTargetVariableChange,
  selectedModel,
  parameterValues,
  onParameterChange,
  dataSplit,
  onDataSplitChange,
}: ParameterSectionWidgetProps) => {
  // 조건부 파라미터 표시 여부 확인
  const shouldShowParameter = (param: Parameter): boolean => {
    if (!param.conditionalShow) return true;

    const { parameter, value } = param.conditionalShow;
    return parameterValues[parameter] === value;
  };

  // 괄호 안의 영문명만 추출하는 함수
  const extractEnglishName = (fullName: string) => {
    // 괄호 안의 내용을 찾는 정규식
    const regex = /\(([^)]+)\)/;

    // 정규식에 매칭되는 결과 찾기
    const match = fullName.match(regex);

    // 매칭 결과가 있으면 첫 번째 그룹(괄호 안의 내용) 반환, 없으면 원래 이름 반환
    return match ? match[1] : fullName;
  };
  // 괄호 앞의 한글명만 추출하는 함수
  const extractKoreanName = (fullName: string) => {
    // 괄호 앞의 내용을 찾는 정규식
    const regex = /^(.*?)\(/;

    // 정규식에 매칭되는 결과 찾기
    const match = fullName.match(regex);

    // 매칭 결과가 있으면 첫 번째 그룹(괄호 앞의 내용) 반환하고 양쪽 공백 제거
    // 없으면 괄호가 없는 문자열이므로 원래 이름 반환
    return match ? match[1].trim() : fullName;
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">파라미터 설정하기</h2>

      {selectedModel ? (
        <>
          {/* 목표변수 선택 */}
          <TargetVariableSelector targetVariables={targetVariables} selectedTargetVariable={selectedTargetVariable} onTargetVariableChange={onTargetVariableChange} />

          {/* 파라미터 목록 */}
          {selectedModel.parameters.filter(shouldShowParameter).map((param) => (
            <div key={param.id} className="mb-8">
              <h3 className="relative mb-4 flex items-center justify-center">
                <span className="bg-[theme(color-gray-03)] mr-2 rounded-full text-2xl select-none">{getParameterEmoji(selectedModel.id, extractEnglishName(param.name))}</span>
                <span className="text-lg">{extractKoreanName(param.name)}</span>
                {param.required && <span className="ml-1 text-[var(--color-error)]">*</span>}
                {/* {param.type === 'slider' && <div className="absolute top-0 right-0 text-lg">{parameterValues[param.id] || param.defaultValue}</div>} */}
              </h3>

              {/* 파라미터 타입별 렌더링 */}
              {param.type === 'slider' && <SliderParameter parameter={param} value={parameterValues[param.id]} onChange={onParameterChange} />}

              {/* gamma 파라미터 특수 처리 */}
              {param.id === 'gamma' && param.type === 'radio' && <GammaParameter parameter={param} value={parameterValues[param.id]} onChange={onParameterChange} />}

              {/* 일반 라디오 타입 파라미터 (gamma 제외) */}
              {param.type === 'radio' && param.id !== 'gamma' && <RadioParameter parameter={param} value={parameterValues[param.id]} onChange={onParameterChange} />}
            </div>
          ))}

          {/* 데이터 분할 비율 */}
          <DataSplitControl dataSplit={dataSplit} onDataSplitChange={onDataSplitChange} />
        </>
      ) : (
        <div className="py-10 text-center text-[var(--color-gray-02)]">모델을 선택하면 파라미터가 표시됩니다.</div>
      )}
    </div>
  );
};

export default ParameterSectionWidget;
