'use client';
import { Parameter, ParameterValue } from '@/entities/workspace/modeling-section/model/types';

interface RadioParameterProps {
  parameter: Parameter;
  value: ParameterValue;
  onChange: (paramId: string, value: ParameterValue) => void;
}

const RadioParameter = ({ parameter, value, onChange }: RadioParameterProps) => {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {parameter.options?.map((option) => (
        <div key={option} className="relative mb-2 inline-block cursor-pointer">
          <input
            type="radio"
            id={`${parameter.id}-${option}`}
            name={parameter.id}
            className="absolute h-0 w-0 opacity-0"
            checked={(value || parameter.defaultValue) === option}
            onChange={() => onChange(parameter.id, option)}
          />
          <label
            htmlFor={`${parameter.id}-${option}`}
            className="relative mb-0 inline-block cursor-pointer pl-8 text-base transition-all duration-300 ease-in-out"
            style={{
              color: (value || parameter.defaultValue) === option ? 'var(--color-blue-02)' : 'inherit',
            }}
          >
            <span
              className={`absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110`}
              style={{
                backgroundColor: (value || parameter.defaultValue) === option ? 'var(--color-blue-02)' : 'var(--color-gray-02)',
                borderRadius: (value || parameter.defaultValue) === option ? '0.5rem' : '50%',
              }}
            ></span>
            {option}
          </label>
        </div>
      ))}
    </div>
  );
};

export default RadioParameter;
