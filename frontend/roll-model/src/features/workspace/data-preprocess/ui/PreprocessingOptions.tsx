'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { ImputedRow } from '@/entities/workspace/data-preprocess/model/types';
import { useAtom, useSetAtom } from 'jotai';
import { uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Step } from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';
import { Button } from '@/components/ui/button';

interface PreprocessingOption {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  method?: string;
}

interface PreprocessingCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  options: PreprocessingOption[];
}

const preprocessingCategories: PreprocessingCategory[] = [
  {
    id: 'missing-values',
    name: '결측치 처리',
    icon: '❓',
    description: '빠진 데이터를 채우거나 삭제할 수 있습니다.',
    options: [
      { id: 'mean', name: '평균값으로 대체', description: '결측치를 평균값으로 대체', apiEndpoint: '/missing-values/imputation', method: 'MEAN' },
      { id: 'median', name: '중앙값으로 대체', description: '결측치를 중앙값으로 대체', apiEndpoint: '/missing-values/imputation', method: 'MEDIAN' },
      { id: 'mode', name: '최빈값으로 대체', description: '결측치를 최빈값으로 대체', apiEndpoint: '/missing-values/imputation', method: 'MODE' },
      { id: 'drop-rows', name: '결측치가 있는 행 제거', description: '결측치가 있는 행 제거', apiEndpoint: '/missing-values/remove', method: 'ROW_REMOVE' },
      { id: 'drop-columns', name: '결측치가 있는 열 제거', description: '결측치가 있는 열 제거', apiEndpoint: '/missing-values/remove', method: 'COL_REMOVE' },
    ],
  },
  {
    id: 'outlier-detection',
    name: '이상치 탐지',
    icon: '🔍',
    description: '데이터의 이상값을 탐지합니다.',
    options: [
      { id: 'z-score', name: 'Z-점수 기반 탐지', description: 'Z-점수로 이상치 탐지', apiEndpoint: '/outliers/detection', method: 'ZSCORE' },
      { id: 'iqr', name: 'IQR 기반 탐지', description: 'IQR로 이상치 탐지', apiEndpoint: '/outliers/detection', method: 'IQR' },
    ],
  },
  {
    id: 'outlier-handle',
    name: '이상치 처리',
    icon: '🛠️',
    description: '탐지된 이상치를 제거하거나 대체합니다.',
    options: [
      { id: 'replace', name: '이상치 대체', description: '이상치를 대체합니다.', apiEndpoint: '/outliers/imputation' },
      { id: 'remove-rows', name: '행 제거', description: '이상치가 있는 행을 제거합니다.', apiEndpoint: '/outliers/remove', method: 'ROW_REMOVE' },
      { id: 'remove-cols', name: '열 제거', description: '이상치가 있는 열을 제거합니다.', apiEndpoint: '/outliers/remove', method: 'COL_REMOVE' },
    ],
  },
  {
    id: 'data-transformation',
    name: '데이터 변환',
    icon: '🔁',
    description: '데이터를 정규화 및 변환합니다.',
    options: [
      { id: 'z-score', name: 'Z-점수 정규화', description: 'Z-score 정규화 적용', apiEndpoint: '/transform/z-score' },
      { id: 'min-max', name: 'Min-Max 정규화', description: 'Min-Max 정규화 적용', apiEndpoint: '/transform/min-max' },
      { id: 'log', name: '로그 변환', description: '로그 변환 적용', apiEndpoint: '/transform/log' },
      { id: 'sqrt', name: '제곱근 변환', description: '제곱근 변환 적용', apiEndpoint: '/transform/sqrt' },
    ],
  },
  {
    id: 'encoding',
    name: '인코딩',
    icon: '🧮',
    description: '범주형 데이터 인코딩',
    options: [
      { id: 'one-hot', name: '원핫 인코딩', description: 'One-hot 인코딩', apiEndpoint: '/encoding/one-hot' },
      { id: 'label', name: '레이블 인코딩', description: 'Label 인코딩', apiEndpoint: '/encoding/label' },
      { id: 'target', name: '타겟 인코딩', description: 'Target 인코딩', apiEndpoint: '/encoding/target' },
    ],
  },
  {
    id: 'class-balancing',
    name: '클래스 불균형 처리',
    icon: '⚖️',
    description: '클래스 불균형 문제 해결',
    options: [
      { id: 'over', name: '오버샘플링', description: 'Over Sampling 적용', apiEndpoint: '/class-balancing', method: 'OVER' },
      { id: 'under', name: '언더샘플링', description: 'Under Sampling 적용', apiEndpoint: '/class-balancing', method: 'UNDER' },
    ],
  },
];

interface PreprocessingOptionsProps {
  pipelineId?: string;
  column?: string;
  onChangeCells?: (cells: Record<string, boolean>) => void;
  onAddStep?: (step: Step) => void;
}

const PreprocessingOptions = ({ pipelineId, column, onChangeCells, onAddStep }: PreprocessingOptionsProps) => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadedDataset, setUploadedDataset] = useAtom(uploadedDatasetAtom);
  const [targetColumn, setTargetColumn] = useState('');
  const [offset, setOffset] = useState(1.0);
  const [samplingRatio, setSamplingRatio] = useState(200);

  const columnNames = uploadedDataset?.originalDatasets.columns || [];

  const toggle = (id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleApply = async (categoryId: string, option: PreprocessingOption) => {
    setLoading(true);

    try {
      const detection = 'ZSCORE';

      const baseUrl = `/api/v2/pipelines/${pipelineId}/preprocessing`;
      const url = `${baseUrl}${option.apiEndpoint}`;

      const body: Record<string, string | number | undefined> = {};

      if (categoryId !== 'class-imbalance') {
        body.column = column;
      }

      switch (categoryId) {
        case 'missing-values':
          body.method = option.method;
          break;

        case 'outlier-detection':
          body.detection = option.method;
          break;

        case 'outlier-handle':
          body.method = option.method || 'MEAN';
          body.detection = detection;
          break;

        case 'data-transformation':
          if (option.id === 'log') {
            body.offset = offset;
          }
          break;

        case 'encoding':
          console.log('option id:', option.id);

          if (option.id === 'target') {
            body.targetColumn = targetColumn;
          }
          break;

        case 'class-balancing':
          body.column = column;
          body.method = option.method || 'OVER';
          body.samplingRatio = samplingRatio;
          break;
      }

      const response = await axiosInstance.post(url, body);
      const result = response.data.data.data.result;
      const updatedDataset = response.data.data.data.dataset;

      console.log('response:', response);

      console.log('result:', result);

      const changed: Record<string, boolean> = {};

      if (result.originalRows && result.imputedRows) {
        result.imputedRows.forEach((newRow: ImputedRow, i: number) => {
          const oldRow = result.originalRows[i];
          if (!oldRow) return;
          const rowIdx = newRow.idx ?? i;
          for (const key in newRow) {
            if (key !== 'idx' && String(newRow[key]) !== String(oldRow[key])) {
              changed[`${rowIdx}:${key}`] = true;
            }
          }
        });
      }

      if (result.outlierCount > 0 && Array.isArray(result.outlierIndices)) {
        result.outlierIndices.forEach((idx: number) => {
          if (column) {
            changed[`${idx}:${column}`] = true;
          }
        });
      }

      onChangeCells?.(changed);

      setUploadedDataset((prev) =>
        prev
          ? {
              ...prev,
              originalDatasets: {
                ...prev.originalDatasets,
                data: updatedDataset,
                columns: Array.from(new Set(updatedDataset.flatMap((row: string) => Object.keys(row).filter((key) => key !== 'idx')))),
              },
            }
          : prev,
      );

      if (onAddStep && column) {
        const parameters: Record<string, string | number | number[]> = { columnId: column };
        if (option.method) parameters.method = option.method;
        if (option.apiEndpoint.includes('outliers')) parameters.detection = detection;
        if (option.apiEndpoint.includes('log')) parameters.offset = offset;
        if (option.apiEndpoint.includes('target')) parameters.targetColumn = targetColumn;
        if (option.apiEndpoint.includes('class-balancing')) parameters.samplingRatio = samplingRatio;

        if (option.apiEndpoint.includes('detection')) {
          parameters.minThreshold = result.minThreshold;
          parameters.maxThreshold = result.maxThreshold;
          parameters.outlierIndices = result.outlierIndices;
        }

        if (option.apiEndpoint.includes('missing-values')) {
          parameters.fillValue = result.fillValue;
        }

        onAddStep({
          type: categoryId.toUpperCase(),
          parameters,
          order: Date.now(),
          active: true,
          categoryId,
          optionId: option.id,
          optionName: option.name,
          optionDescription: option.description,
        });
      }
    } catch (error) {
      console.error('전처리 요청 실패:', error);
    } finally {
      setLoading(false);
      setSelected({});
    }
  };

  return (
    <div className="flex max-h-[34rem] flex-col space-y-2 overflow-y-auto pr-2">
      {preprocessingCategories.map((cat) => {
        const isOpen = expanded.includes(cat.id);
        return (
          <div key={cat.id} className="rounded-md border border-[var(--color-gray-02)] transition-shadow duration-200">
            <div
              className={`flex cursor-pointer items-center justify-between rounded-t-md p-3 transition-colors duration-200 ${isOpen ? 'bg-[theme(color-gray-04)]' : 'hover:bg-[theme(color-gray-04)]'}`}
              onClick={() => toggle(cat.id)}
            >
              <div className="flex items-center">
                <span className="font-tossface mr-2">{cat.icon}</span>
                <span className="text-[0.95rem] font-medium">{cat.name}</span>
              </div>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
              <div className="flex items-center">
                <p className="mx-4 my-2 text-xs text-[var(--color-gray-01)]">{cat.description}</p>
              </div>
            )}

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} border-t border-[var(--color-gray-04)]`}>
              {cat.options.map((opt) => {
                const isSelected = selected[cat.id] === opt.id;
                const needsTargetColumn = opt.apiEndpoint.includes('/target');
                const needsOffset = opt.apiEndpoint.includes('/log');
                const needsSampling = cat.id === 'class-balancing';

                const isValid = (!needsTargetColumn || targetColumn) && (!needsOffset || offset !== undefined) && (!needsSampling || samplingRatio !== undefined);

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelected((prev) => ({ ...prev, [cat.id]: opt.id }))}
                    className={`flex items-center justify-between p-3 pl-4 text-sm transition-colors duration-200 ${selected[cat.id] === opt.id ? 'bg-blue-50' : 'hover:bg-[theme(color-gray-05)]'}`}
                  >
                    <div className="cursor-pointer" onClick={() => setSelected((prev) => ({ ...prev, [cat.id]: opt.id }))}>
                      <div className="mb-2">
                        <p className="text-sm font-semibold">{opt.name}</p>
                        <p className="text-xs text-[var(--color-gray-01)]">{opt.description}</p>
                      </div>

                      {isSelected && (
                        <div className="">
                          {needsTargetColumn && (
                            <div>
                              <label className="block text-sm font-medium">타겟 컬럼</label>
                              <Select value={targetColumn} onValueChange={setTargetColumn}>
                                <SelectTrigger>
                                  <SelectValue placeholder="선택하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                  {columnNames.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          {needsOffset && (
                            <div>
                              <label className="block text-sm font-medium">Offset</label>
                              <Input type="number" value={offset} onChange={(e) => setOffset(Number(e.target.value))} />
                            </div>
                          )}
                          {needsSampling && (
                            <div>
                              <label className="block text-sm font-medium">Sampling Ratio (%)</label>
                              <Input type="number" value={samplingRatio} onChange={(e) => setSamplingRatio(Number(e.target.value))} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="mt-2">
                        <Button
                          variant="black"
                          size="sm"
                          disabled={!isValid || loading}
                          onClick={() => handleApply(cat.id, opt)}
                          className={`ml-2 rounded-sm ${!isValid || loading ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-800'}`}
                        >
                          적용
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="mt-2 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      )}
    </div>
  );
};

export default PreprocessingOptions;
