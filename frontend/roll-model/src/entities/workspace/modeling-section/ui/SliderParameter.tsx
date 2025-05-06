'use client';
import { Parameter, ParameterValue } from '@/entities/workspace/modeling-section/model/types';

interface SliderParameterProps {
  parameter: Parameter;
  value: ParameterValue;
  onChange: (paramId: string, value: ParameterValue ) => void;
}

const SliderParameter = ({ parameter, value, onChange }: SliderParameterProps) => {
  return (
    <>
      <input
        type="range"
        min={parameter.min}
        max={parameter.max}
        step={parameter.step}
        value={value || parameter.defaultValue}
        onChange={(e) => onChange(parameter.id, Number(e.target.value))}
        className="w-full accent-[var(--color-mint-01)]"
      />
      <div className="text-right text-sm">{value || parameter.defaultValue}</div>
    </>
  );
};

export default SliderParameter;
