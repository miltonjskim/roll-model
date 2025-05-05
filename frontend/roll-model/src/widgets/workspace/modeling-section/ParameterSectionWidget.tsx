'use client';
import { useState } from 'react';
import { Model, Parameter, ParameterValues } from '@/entities/workspace/modeling-section/model/types';

interface ParameterSectionWidgetProps {
  targetVariables: string[];
  selectedTargetVariable: string;
  onTargetVariableChange: (variable: string) => void;
  selectedModel: Model | undefined;
  parameterValues: ParameterValues;
  onParameterChange: (paramId: string, value: any) => void;
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
  // 감마 값 직접 입력 모드 상태
  const [gammaCustomMode, setGammaCustomMode] = useState(false);

  // 조건부 파라미터 표시 여부 확인
  const shouldShowParameter = (param: Parameter): boolean => {
    if (!param.conditionalShow) return true;

    const { parameter, value } = param.conditionalShow;
    return parameterValues[parameter] === value;
  };

  // 슬라이더와 라디오 버튼이 혼합된 gamma 파라미터 핸들러
  const handleGammaChange = (param: Parameter, value: string | number) => {
    if (value === 'custom' && param.sliderOptions) {
      setGammaCustomMode(true);
      onParameterChange(param.id, param.sliderOptions.defaultValue);
    } else {
      setGammaCustomMode(false);
      onParameterChange(param.id, value);
    }
  };

  return (
    <div>
      {/* 애니메이션 스타일 추가 */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 #0b6e4f90;
            transform: rotate(20deg);
          }
          50% {
            transform: rotate(-20deg);
          }
          75% {
            box-shadow: 0 0 0 10px #0b6e4f60;
          }
          100% {
            box-shadow: 0 0 0 13px #0b6e4f30;
            transform: rotate(0);
          }
        }
        .radio-animate {
          animation: pulse 500ms ease-in-out;
        }
      `}</style>

      <h2 className="mb-4 text-xl font-bold">파라미터 설정하기</h2>

      {selectedModel ? (
        <>
          {/* 목표변수 선택 */}
          <div className="mb-6">
            <h3 className="mb-2 text-lg">목표변수 선택</h3>
            <div className="grid grid-cols-3 gap-4">
              {targetVariables.map((variable) => (
                <div key={variable} className="relative inline-block cursor-pointer">
                  <input
                    type="radio"
                    id={variable}
                    name="targetVariable"
                    className="absolute h-0 w-0 opacity-0"
                    checked={selectedTargetVariable === variable}
                    onChange={() => onTargetVariableChange(variable)}
                  />
                  <label
                    htmlFor={variable}
                    className="relative mb-2.5 inline-block cursor-pointer pl-8 text-base transition-all duration-300 ease-in-out"
                    style={{
                      color: selectedTargetVariable === variable ? 'var(--color-blue-02)' : 'inherit',
                    }}
                  >
                    <span
                      className={`absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[var(--color-blue-02)]/50 hover:shadow-lg ${selectedTargetVariable === variable ? 'radio-animate' : ''}`}
                      style={{
                        backgroundColor: selectedTargetVariable === variable ? 'var(--color-blue-02)' : '#ccc',
                        borderRadius: selectedTargetVariable === variable ? '0.5rem' : '50%',
                      }}
                    ></span>
                    {variable}
                  </label>
                </div>
              ))}
            </div>
          </div>
          {/* 파라미터 목록 */}
          {selectedModel.parameters.filter(shouldShowParameter).map((param) => (
            <div key={param.id} className="mb-4">
              <h3 className="mb-2">
                {param.name}
                {param.required && <span className="ml-1 text-[var(--color-error)]">*</span>}
              </h3>

              {/* 일반 슬라이더 타입 파라미터 */}
              {param.type === 'slider' && (
                <>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={parameterValues[param.id] || param.defaultValue}
                    onChange={(e) => onParameterChange(param.id, Number(e.target.value))}
                    className="w-full accent-[var(--color-mint-01)]"
                  />
                  <div className="text-right text-sm">{parameterValues[param.id] || param.defaultValue}</div>
                </>
              )}

              {/* gamma 파라미터 특수 처리 (radio + 선택적 slider) */}
              {param.id === 'gamma' && param.type === 'radio' && (
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-6">
                    {param.options?.map((option) => (
                      <div key={option} className="relative inline-block cursor-pointer">
                        <input
                          type="radio"
                          id={`${param.id}-${option}`}
                          name={param.id}
                          className="absolute h-0 w-0 opacity-0"
                          checked={!gammaCustomMode && (parameterValues[param.id] || param.defaultValue) === option}
                          onChange={() => handleGammaChange(param, option)}
                        />
                        <label
                          htmlFor={`${param.id}-${option}`}
                          className="relative mb-2.5 inline-block cursor-pointer pl-8 text-base transition-all duration-300 ease-in-out"
                          style={{
                            color: !gammaCustomMode && (parameterValues[param.id] || param.defaultValue) === option ? 'var(--color-primary-foreground)' : 'inherit',
                          }}
                        >
                          <span
                            className={`absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[var(--color-primary-foreground)]/50 hover:shadow-lg ${!gammaCustomMode && (parameterValues[param.id] || param.defaultValue) === option ? 'radio-animate' : ''}`}
                            style={{
                              backgroundColor: !gammaCustomMode && (parameterValues[param.id] || param.defaultValue) === option ? 'var(--color-primary-foreground)' : '#ccc',
                              borderRadius: !gammaCustomMode && (parameterValues[param.id] || param.defaultValue) === option ? '0.5rem' : '50%',
                            }}
                          ></span>
                          {option}
                        </label>
                      </div>
                    ))}
                    <div className="relative inline-block cursor-pointer">
                      <input
                        type="radio"
                        id={`${param.id}-custom`}
                        name={param.id}
                        className="absolute h-0 w-0 opacity-0"
                        checked={gammaCustomMode}
                        onChange={() => handleGammaChange(param, 'custom')}
                      />
                      <label
                        htmlFor={`${param.id}-custom`}
                        className="relative mb-2.5 inline-block cursor-pointer pl-8 text-base transition-all duration-300 ease-in-out"
                        style={{
                          color: gammaCustomMode ? 'var(--color-primary-foreground)' : 'inherit',
                        }}
                      >
                        <span
                          className={`absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[var(--color-primary-foreground)]/50 hover:shadow-lg ${gammaCustomMode ? 'radio-animate' : ''}`}
                          style={{
                            backgroundColor: gammaCustomMode ? 'var(--color-primary-foreground)' : '#ccc',
                            borderRadius: gammaCustomMode ? '0.5rem' : '50%',
                          }}
                        ></span>
                        직접 입력
                      </label>
                    </div>
                  </div>

                  {/* 직접 입력 모드일 때 슬라이더 표시 */}
                  {gammaCustomMode && param.sliderOptions && (
                    <>
                      <input
                        type="range"
                        min={param.sliderOptions.min}
                        max={param.sliderOptions.max}
                        step={param.sliderOptions.step}
                        value={parameterValues[param.id] || param.sliderOptions.defaultValue}
                        onChange={(e) => onParameterChange(param.id, Number(e.target.value))}
                        className="w-full accent-[var(--color-green-01)]"
                      />
                      <div className="text-right text-sm">{parameterValues[param.id] || param.sliderOptions.defaultValue}</div>
                    </>
                  )}
                </div>
              )}

              {/* 일반 라디오 타입 파라미터 (gamma 제외) */}
              {param.type === 'radio' && param.id !== 'gamma' && (
                <div className="flex flex-wrap items-center gap-6">
                  {param.options?.map((option) => (
                    <div key={option} className="relative mb-2 inline-block cursor-pointer">
                      <input
                        type="radio"
                        id={`${param.id}-${option}`}
                        name={param.id}
                        className="absolute h-0 w-0 opacity-0"
                        checked={(parameterValues[param.id] || param.defaultValue) === option}
                        onChange={() => onParameterChange(param.id, option)}
                      />
                      <label
                        htmlFor={`${param.id}-${option}`}
                        className="relative mb-0 inline-block cursor-pointer pl-8 text-base transition-all duration-300 ease-in-out"
                        style={{
                          color: (parameterValues[param.id] || param.defaultValue) === option ? 'var(--color-primary-foreground)' : 'inherit',
                        }}
                      >
                        <span
                          className={`absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[var(--color-primary-foreground)]/50 hover:shadow-lg ${(parameterValues[param.id] || param.defaultValue) === option ? 'radio-animate' : ''}`}
                          style={{
                            backgroundColor: (parameterValues[param.id] || param.defaultValue) === option ? 'var(--color-blue-02)' : '#ccc',
                            borderRadius: (parameterValues[param.id] || param.defaultValue) === option ? '0.5rem' : '50%',
                          }}
                        ></span>
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 데이터 분할 비율 */}
          <div>
            <h3 className="mb-2">데이터 분할 비율</h3>
            <div className="relative pt-1">
              <input type="range" min="50" max="90" step="5" value={dataSplit} onChange={(e) => onDataSplitChange(Number(e.target.value))} className="w-full accent-[var(--color-blue-01)]" />
              <div className="mt-2 flex justify-between">
                {/* 데이터 분할 비율 계산 개선 */}
                <span className="rounded-full bg-[var(--color-primary)] px-2 py-1 text-xs text-[var(--color-primary-foreground)]">{dataSplit}% 학습데이터</span>
                <span className="rounded-full bg-[var(--color-yellow-01)] px-2 py-1 text-xs text-[var(--primary-black)]">{Math.floor((100 - dataSplit) * 0.7)}% 검증데이터</span>
                <span className="rounded-full bg-[var(--color-blue-01)] px-2 py-1 text-xs text-[var(--color-primary-foreground)]">
                  {100 - dataSplit - Math.floor((100 - dataSplit) * 0.7)}% 테스트데이터
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="py-10 text-center text-[var(--color-gray-02)]">모델을 선택하면 파라미터가 표시됩니다.</div>
      )}
    </div>
  );
};

export default ParameterSectionWidget;
