'use client';

interface TargetVariableSelectorProps {
  targetVariables: string[];
  selectedTargetVariable: string;
  onTargetVariableChange: (variable: string) => void;
}

const TargetVariableSelector = ({ targetVariables, selectedTargetVariable, onTargetVariableChange }: TargetVariableSelectorProps) => {
  return (
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
                className={`absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110`}
                style={{
                  backgroundColor: selectedTargetVariable === variable ? 'var(--color-blue-02)' : 'var(--color-gray-02)',
                  borderRadius: selectedTargetVariable === variable ? '0.5rem' : '50%',
                }}
              ></span>
              {variable}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TargetVariableSelector;
