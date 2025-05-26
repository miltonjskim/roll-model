'use client';
import { Model, ModelCategory } from '@/entities/workspace/modeling-section/model/types';

interface ModelSelectionWidgetProps {
  models: Model[];
  selectedModelId: string;
  onModelSelect: (id: string) => void;
  modelCategory: ModelCategory;
}

const ModelSelectionWidget = ({ models, selectedModelId, onModelSelect, modelCategory }: ModelSelectionWidgetProps) => {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">{modelCategory === 'CLASSIFICATION' ? '분류' : '회귀'} 모델 선택하기</h2>

      {/* 모델 목록 */}
      <div className="space-y-4">
        {models.map((model) => (
          <div
            key={model.id}
            className={`cursor-pointer rounded-[var(--radius-md)] border p-4 transition-colors ${
              selectedModelId === model.id ? 'border-[var(--color-blue-01)] bg-[var(--color-blue-03)]' : 'border-[var(--color-border)] hover:border-[var(--color-blue-01)]'
            }`}
            onClick={() => onModelSelect(model.id)}
          >
            <h3 className="font-bold">{model.name}</h3>
            <p className="mt-2 text-sm text-[var(--color-gray-01)]">{model.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelectionWidget;
