'use client';
import { useState } from 'react';
import { Parameter, ParameterValue } from '@/entities/workspace/modeling-section/model/types';

interface GammaParameterProps {
  parameter: Parameter;
  value: ParameterValue;
  onChange: (paramId: string, value: ParameterValue) => void;
}

const GammaParameter = ({ parameter, value, onChange }: GammaParameterProps) => {
  const [customMode, setCustomMode] = useState(false);

  // 커스텀 모드 변경 핸들러
  const handleChange = (newValue: string | number) => {
    if (newValue === 'custom' && parameter.sliderOptions) {
      setCustomMode(true);
      onChange(parameter.id, parameter.sliderOptions.defaultValue);
    } else {
      setCustomMode(false);
      onChange(parameter.id, newValue);
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-6">
        {parameter.options?.map((option) => (
          <div key={option} className="relative inline-block cursor-pointer">
            <input
              type="radio"
              id={`${parameter.id}-${option}`}
              name={parameter.id}
              className="absolute h-0 w-0 opacity-0"
              checked={!customMode && (value || parameter.defaultValue) === option}
              onChange={() => handleChange(option)}
            />
            <label
              htmlFor={`${parameter.id}-${option}`}
              className="relative mb-2.5 inline-block cursor-pointer pl-8 text-base transition-all duration-300 ease-in-out"
              style={{
                color: !customMode && (value || parameter.defaultValue) === option ? 'var(--color-primary-foreground)' : 'inherit',
              }}
            >
              <span
                className={`absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110`}
                style={{
                  backgroundColor: !customMode && (value || parameter.defaultValue) === option ? 'var(--color-blue-02)' : 'var(--color-gray-02)',
                  borderRadius: !customMode && (value || parameter.defaultValue) === option ? '0.5rem' : '50%',
                }}
              ></span>
              {option}
            </label>
          </div>
        ))}
        <div className="relative inline-block cursor-pointer">
          <input type="radio" id={`${parameter.id}-custom`} name={parameter.id} className="absolute h-0 w-0 opacity-0" checked={customMode} onChange={() => handleChange('custom')} />
          <label
            htmlFor={`${parameter.id}-custom`}
            className="relative mb-2.5 inline-block cursor-pointer pl-8 text-base transition-all duration-300 ease-in-out"
            style={{
              color: customMode ? 'var(--color-primary-foreground)' : 'inherit',
            }}
          >
            <span
              className={`absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110`}
              style={{
                backgroundColor: customMode ? 'var(--color-blue-02)' : 'var(--color-gray-02)',
                borderRadius: customMode ? '0.5rem' : '50%',
              }}
            ></span>
            직접 입력
          </label>
        </div>
      </div>

      {/* 직접 입력 모드일 때 슬라이더 표시 */}
      {customMode && parameter.sliderOptions && (
        <>
          <input
            type="range"
            min={parameter.sliderOptions.min}
            max={parameter.sliderOptions.max}
            step={parameter.sliderOptions.step}
            value={value || parameter.sliderOptions.defaultValue}
            onChange={(e) => onChange(parameter.id, Number(e.target.value))}
            className="w-full accent-[var(--color-green-01)]"
          />
          <div className="text-right text-sm">{value || parameter.sliderOptions.defaultValue}</div>
        </>
      )}
    </div>
  );
};

export default GammaParameter;
