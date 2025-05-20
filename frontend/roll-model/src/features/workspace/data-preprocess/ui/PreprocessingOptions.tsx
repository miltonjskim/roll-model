'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { ImputedRow, Step } from '@/entities/workspace/data-preprocess/model/types';
import { useAtom, useSetAtom } from 'jotai';
import { preprocessErrorMsgAtom, uploadedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { globalLoadingAtom, globalLoadingMessageAtom } from '@/shared/model/atoms/GlobalLoadingAtom';
import PreprocessingInfoDialog from '@/features/workspace/data-preprocess/ui/PreprocessingInfoDialog';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiError } from '@/shared/model/types/apiResponse';
import { AxiosError } from 'axios';

interface PreprocessingOption {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  method?: string;
  requireColumn?: boolean;
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
    id: 'MISSING_VALUES',
    name: '결측치 처리',
    icon: '❓',
    description: '빠진 데이터를 채우거나 삭제할 수 있습니다.',
    options: [
      { id: 'mean', name: '평균값으로 대체', description: '결측치를 해당 컬럼의 평균값으로 대체합니다.', apiEndpoint: '/missing-values/imputation', method: 'MEAN', requireColumn: true },
      { id: 'median', name: '중앙값으로 대체', description: '결측치를 해당 컬럼의 중앙값으로 대체합니다.', apiEndpoint: '/missing-values/imputation', method: 'MEDIAN', requireColumn: true },
      { id: 'mode', name: '최빈값으로 대체', description: '결측치를 해당 컬럼의 최빈값으로 대체합니다.', apiEndpoint: '/missing-values/imputation', method: 'MODE', requireColumn: true },
      { id: 'drop-rows', name: '결측치가 있는 행 제거', description: '결측치를 포함한 행 전체를 삭제합니다.', apiEndpoint: '/missing-values/remove', method: 'ROW_REMOVE' },
      { id: 'drop-columns', name: '결측치가 있는 열 제거', description: '결측치를 포함한 컬럼 전체를 삭제합니다.', apiEndpoint: '/missing-values/remove', method: 'COL_REMOVE' },
    ],
  },
  {
    id: 'OUTLIER_DETECTION',
    name: '이상치 탐지',
    icon: '🔍',
    description: '데이터에서 통계적 기준(Z-score, IQR 등)을 활용해 이상값을 탐지합니다.',
    options: [
      { id: 'z-score', name: 'Z-점수 기반 탐지', description: '평균과 표준편차를 이용해 임계값을 초과하는 값을 이상치로 탐지합니다.', apiEndpoint: '/outliers/detection', method: 'ZSCORE' },
      { id: 'iqr', name: 'IQR 기반 탐지', description: '사분위 범위(IQR)를 기준으로 이상치를 탐지합니다.', apiEndpoint: '/outliers/detection', method: 'IQR' },
    ],
  },
  {
    id: 'OUTLIER_HANDLE',
    name: '이상치 처리',
    icon: '🛠️',
    description: '탐지된 이상치를 제거하거나 평균, 중앙값 등으로 대체합니다.',
    options: [
      { id: 'mean', name: '평균값으로 대체', description: '이상치를 해당 컬럼의 평균값으로 대체합니다.', apiEndpoint: '/outliers/imputation', method: 'MEAN', requireColumn: true },
      { id: 'median', name: '중앙값으로 대체', description: '이상치를 해당 컬럼의 평균값으로 대체합니다.', apiEndpoint: '/outliers/imputation', method: 'MEDIAN', requireColumn: true },
      { id: 'mode', name: '최빈값으로 대체', description: '이상치를 해당 컬럼의 임계값으로 대체합니다.', apiEndpoint: '/outliers/imputation', method: 'MODE', requireColumn: true },
      { id: 'remove-rows', name: '행 제거', description: '탐지된 이상치가 포함된 행을 삭제합니다.', apiEndpoint: '/outliers/remove', method: 'ROW_REMOVE', requireColumn: true },
      { id: 'remove-cols', name: '열 제거', description: '탐지된 이상치가 포함된 컬럼을 삭제합니다.', apiEndpoint: '/outliers/remove', method: 'COL_REMOVE', requireColumn: true },
    ],
  },
  {
    id: 'DATA_TRANSFORMATION',
    name: '데이터 정규화',
    icon: '🔁',
    description: '데이터 분포나 범위를 조정하여 모델 학습에 적합하도록 변환합니다.',
    options: [
      { id: 'z-score', name: 'Z-점수 정규화', description: '값을 평균 0, 표준편차 1로 표준화합니다.', apiEndpoint: '/transform/z-score' },
      { id: 'min-max', name: 'Min-Max 정규화', description: '값을 최소값과 최대값을 기준으로 0~1 범위로 정규화합니다.', apiEndpoint: '/transform/min-max' },
      { id: 'log', name: '로그 변환', description: '값에 로그를 적용하여 분포의 왜곡을 줄입니다.', apiEndpoint: '/transform/log', requireColumn: true },
      { id: 'sqrt', name: '제곱근 변환', description: '값에 제곱근을 적용하여 스케일을 조정합니다.', apiEndpoint: '/transform/sqrt', requireColumn: true },
    ],
  },
  {
    id: 'ENCODING',
    name: '인코딩',
    icon: '🧮',
    description: '문자형 데이터를 숫자형으로 변환합니다.',
    options: [
      { id: 'one-hot', name: '원핫 인코딩', description: '범주형 값을 0과 1로 구성된 이진 벡터로 변환합니다.', apiEndpoint: '/encoding/one-hot', requireColumn: true },
      { id: 'label', name: '레이블 인코딩', description: '범주형 값을 정수(0, 1, 2...)로 변환합니다.', apiEndpoint: '/encoding/label', requireColumn: true },
      { id: 'target', name: '타겟 인코딩', description: '각 범주를 해당 클래스의 평균 타겟값으로 변환합니다.', apiEndpoint: '/encoding/target' },
    ],
  },
  {
    id: 'CLASS_BALANCING',
    name: '클래스 불균형 처리',
    icon: '⚖️',
    description: '데이터 내 클래스 간 샘플 수의 불균형 문제를 해결합니다.',
    options: [
      { id: 'over', name: '오버샘플링', description: '소수 클래스의 데이터를 복제하여 샘플 수를 늘립니다.', apiEndpoint: '/class-balancing', method: 'OVER' },
      { id: 'under', name: '언더샘플링', description: '다수 클래스의 데이터를 일부 제거하여 균형을 맞춥니다.', apiEndpoint: '/class-balancing', method: 'UNDER' },
    ],
  },
];

interface PreprocessingOptionsProps {
  pipelineId?: string;
  onChangeCells?: (cells: Record<string, boolean>) => void;
  onAddStep?: (step: Step) => void;
}

const PreprocessingOptions = ({ pipelineId, onChangeCells, onAddStep }: PreprocessingOptionsProps) => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useAtom(globalLoadingAtom);
  const setLoadingmessage = useSetAtom(globalLoadingMessageAtom);
  const [uploadedDataset, setUploadedDataset] = useAtom(uploadedDatasetAtom);
  const [targetColumn, setTargetColumn] = useState('');
  const [offset, setOffset] = useState(1.0);
  const [samplingRatio, setSamplingRatio] = useState(200);
  const setPreprocessingErrorMsg = useSetAtom(preprocessErrorMsgAtom);

  const columnNames = uploadedDataset?.originalDatasets.columns || [];

  const toggle = (id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleApply = async (categoryId: string, option: PreprocessingOption) => {
    setLoading(true);
    setLoadingmessage('요청하신 전처리 옵션을 진행하고 있습니다.');
    setPreprocessingErrorMsg('');
    try {
      const baseUrl = `/api/v2/pipelines/${pipelineId}/preprocessing`;
      const url = `${baseUrl}${option.apiEndpoint}`;
      const column = selectedColumn ?? null;

      const body: Record<string, string | number | undefined | null> = {
        column,
      };

      if (option.method) {
        console.log('option:', option);

        if (categoryId === 'OUTLIER_DETECTION') {
          console.log('categoryId:', categoryId);
          body.detection = option.method;
          console.log('option.method:', option.method);
          console.log('body.detection:', body.detection);
        } else if (categoryId === 'OUTLIER_HANDLE') {
          body.detection = 'ZSCORE';
          body.method = option.method;
        } else {
          body.method = option.method;
        }
      }

      console.log('body:', body);

      if (option.apiEndpoint.includes('log')) body.offset = offset;
      if (option.apiEndpoint.includes('target')) body.targetColumn = targetColumn;
      if (option.apiEndpoint.includes('class-balancing')) body.samplingRatio = samplingRatio;

      const response = await axiosInstance.post(url, body);
      const result = response.data.data.data.result;
      const updatedDataset = response.data.data.data.dataset;

      console.log('response:', response);

      console.log('result:', result);

      const changed: Record<string, boolean> = {};
      if (result.originalRows && result.imputedRows) {
        result.imputedRows.forEach((newRow: ImputedRow, i: number) => {
          const oldRow = result.originalRows[i];
          const rowIdx = newRow.idx ?? i;
          for (const key in newRow) {
            if (key !== 'idx' && String(newRow[key]) !== String(oldRow?.[key])) {
              changed[`${rowIdx}:${key}`] = true;
            }
          }
        });
      }

      if (result.outlierCount && result.outlierIndices && selectedColumn) {
        result.outlierIndices.forEach((idx: number) => {
          changed[`${idx}:${selectedColumn}`] = true;
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

      onAddStep?.({
        type: categoryId.toUpperCase(),
        parameters: {
          column: result.column,

          // 결측치 대체
          ...(categoryId === 'MISSING_VALUES' &&
            option.apiEndpoint.includes('imputation') && {
              fillValue: result.fillValue,
              imputedCount: result.imputedCount,
              imputedRows: result.imputedRows,
              method: result.method,
              missingCount: result.missingCount,
              missingIndices: result.missingIndices,
            }),

          // 결측치 제거
          ...(categoryId === 'MISSING_VALUES' &&
            option.apiEndpoint.includes('remove') && {
              method: result.method,
              missingCount: result.missingCount,
              missingIndices: result.missingIndices,
              removeColumns: result.removeColumns,
              removedCount: result.removedCount,
              removedRows: result.removedRows,
            }),

          // 이상치 탐지
          ...(categoryId === 'OUTLIER_DETECTION' &&
            option.apiEndpoint.includes('detection') && {
              detection: result.detection,
              maxThreshold: result.maxThreshold,
              minThreshold: result.minThreshold,
              outlierCount: result.outlierCount,
              outlierIndices: result.outlierIndices,
            }),

          // 이상치 대체
          ...(categoryId === 'OUTLIER_HANDLE' &&
            option.apiEndpoint.includes('imputation') && {
              detection: result.detection,
              imputedCount: result.imputedCount,
              imputedRows: result.imputedRows,
              method: result.method,
              minThreshold: result.minThreshold,
              maxThreshold: result.maxThreshold,
              outlierCount: result.outlierCount,
              outlierIndices: result.outlierIndices,
            }),

          // 이상치 제거
          ...(categoryId === 'OUTLIER_HANDLE' &&
            option.apiEndpoint.includes('remove') && {
              method: result.method,
              detection: result.detection,
              minThreshold: result.minThreshold,
              maxThreshold: result.maxThreshold,
              outlierCount: result.outlierCount,
              outlierIndices: result.outlierIndices,
              removedColumns: result.removedColumns,
              removedCount: result.removedCount,
              removedRows: result.removedRows,
            }),

          // 데이터 정규화: z-score 정규화
          ...(categoryId === 'DATA_TRANSFORMATION' &&
            option.apiEndpoint.includes('z-score') && {
              transformType: result.transformType,
              statistics_mean: result.statistics.mean,
              statistics_std: result.statistics.std,
            }),

          // 데이터 정규화: min-max 정규화
          ...(categoryId === 'DATA_TRANSFORMATION' &&
            option.apiEndpoint.includes('min-max') && {
              transformType: result.transformType,
              newRange_min: result.newRange.min,
              newRange_max: result.newRange.max,
            }),

          // 데이터 정규화: 로그 변환
          ...(categoryId === 'DATA_TRANSFORMATION' &&
            option.apiEndpoint.includes('log') && {
              transformType: result.transformType,
              negativeValues: result.negativeValues,
              offset: result.offset,
              transformedIndices: result.transformedIndices,
            }),

          // 데이터 정규화: 제곱근 변환
          ...(categoryId === 'DATA_TRANSFORMATION' &&
            option.apiEndpoint.includes('sqrt') && {
              transformType: result.transformType,
              negativeValues: result.negativeValues,
              transformedIndices: result.transformedIndices,
            }),

          // 인코딩: 원핫 인코딩
          ...(categoryId === 'ENCODING' &&
            option.apiEndpoint.includes('one-hot') && {
              affectedRows: result.affectedRows,
              categories: result.categories,
              encodingType: result.encodingType,
              newColumns: result.newColumns,
            }),

          // 인코딩: 레이블 인코딩
          ...(categoryId === 'ENCODING' &&
            option.apiEndpoint.includes('label') && {
              affectedRows: result.affectedRows,
              encodingType: result.encodingType,
              mapping: result.mapping,
            }),

          // 인코딩: 타겟 인코딩
          ...(categoryId === 'ENCODING' &&
            option.apiEndpoint.includes('target') && {
              affectedRows: result.affectedRows,
              encodingType: result.encodingType,
              mapping: result.mapping,
              targetColumn: result.targetColumn,
            }),

          // 클래스 불균형 처리
          ...(categoryId === 'CLASS_BALANCING' &&
            option.apiEndpoint.includes('class-balancing') && {
              balanceType: result.balanceType,
              originalDistributuin: result.originalDistribution,
              newDistribution: result.newDistribution,
              samplingRatio: result.samplingRatio,
              sampleVariation: result.sampleVariation,
            }),
        },
        order: Date.now(),
        active: true,
        categoryId,
        optionId: option.id,
        optionName: option.name,
      });

      setExpanded([]);
      setSelected({});
      setSelectedColumn(undefined);
      setTargetColumn('');
      setOffset(1.0);
      setSamplingRatio(200);
    } catch (error) {
      const axiosError = error as AxiosError<{ error: { message: string } }>;
      console.error('전처리 요청 실패:', axiosError);

      showErrorToast(axiosError.response?.data?.error?.message);
      setPreprocessingErrorMsg(axiosError.response?.data?.error?.message ? axiosError.response?.data?.error?.message : '');
    } finally {
      setLoading(false);
      setLoadingmessage(null);
      setSelected({});
    }
  };

  return (
    <div className="flex h-full flex-col space-y-2 overflow-hidden">
      <PreprocessingInfoDialog />
      <div className="mb-2 text-center text-sm">
        <span className="text-[var(--color-error-text)]">*</span> 문자형 데이터는 인코딩이 꼭 필요합니다!
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {preprocessingCategories.map((cat) => {
          const isOpen = expanded.includes(cat.id);
          return (
            <div key={cat.id} className="rounded-md border border-[var(--color-gray-02)] transition-shadow duration-200">
              <div
                className={`flex cursor-pointer items-start justify-between rounded-t-md p-3 transition-colors duration-200 ${isOpen ? 'bg-[theme(color-gray-04)]' : 'hover:bg-[theme(color-gray-04)]'}`}
                onClick={() => toggle(cat.id)}
              >
                <div className="flex items-start">
                  <span className="font-tossface mr-2">{cat.icon}</span>
                  <span className="text-[0.95rem] font-medium">{cat.name}</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {isOpen && (
                <div className="flex items-start">
                  <p className="mx-4 my-2 text-xs text-[var(--color-gray-01)]">{cat.description}</p>
                </div>
              )}

              <div className={`overflow-y-auto transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'max-h-0 opacity-0'} border-t border-[var(--color-gray-04)]`}>
                {cat.options.map((opt) => {
                  const isSelected = selected[cat.id] === opt.id;
                  const needsTargetColumn = opt.apiEndpoint.includes('/target');
                  const needsOffset = opt.apiEndpoint.includes('/log');
                  const needsSampling = cat.id === 'CLASS_BALANCING';

                  const isValid = (!needsTargetColumn || targetColumn) && (!needsOffset || offset !== undefined) && (!needsSampling || samplingRatio !== undefined);

                  return (
                    <div
                      key={opt.id}
                      className={`group flex flex-col gap-3 border-b border-gray-200 p-4 transition-colors duration-200 ${isSelected ? 'bg-blue-50' : 'hover:bg-[theme(color-gray-05)]'}`}
                    >
                      {/* 항목 상단: 이름과 설명 */}
                      <button onClick={() => setSelected((prev) => ({ ...prev, [cat.id]: opt.id }))} className="text-left">
                        <p className="text-sm font-semibold">{opt.name}</p>
                        <p className="text-xs text-[var(--color-gray-01)]">{opt.description}</p>
                      </button>

                      {/* 조건부 렌더링: 폼 */}
                      {isSelected && (
                        <div className="space-y-3">
                          {/** 컬럼 선택 */}
                          <div>
                            <label className="block text-left text-xs font-medium">적용 컬럼</label>
                            <Select value={opt.requireColumn ? selectedColumn || '' : (selectedColumn ?? '__ALL__')} onValueChange={(val) => setSelectedColumn(val === '__ALL__' ? undefined : val)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="전처리할 컬럼을 선택하세요." className="text-left text-sm" />
                              </SelectTrigger>
                              <SelectContent>
                                {!opt.requireColumn && <SelectItem value="__ALL__">전체 컬럼</SelectItem>}
                                {columnNames.map((col) => (
                                  <SelectItem key={col} value={col}>
                                    {col}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {needsTargetColumn && (
                            <div>
                              <label className="block text-left text-xs font-medium">타겟 컬럼</label>
                              <Select value={targetColumn} onValueChange={setTargetColumn}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="선택하세요" className="text-left text-sm" />
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
                              <label className="block text-xs font-medium">Offset</label>
                              <Input type="number" value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="w-full" />
                            </div>
                          )}

                          {needsSampling && (
                            <div>
                              <label className="block text-xs font-medium">Sampling Ratio (%)</label>
                              <Input type="number" value={samplingRatio} onChange={(e) => setSamplingRatio(Number(e.target.value))} className="w-full" />
                            </div>
                          )}

                          <Button variant="black" size="sm" onClick={() => handleApply(cat.id, opt)} disabled={!isValid || loading} className="mt-2 w-full">
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
      </div>
    </div>
  );
};

export default PreprocessingOptions;
