'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

interface PreprocessingOption {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
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
      { id: 'mean', name: '평균값으로 대체', description: '결측치를 해당 컬럼의 평균값으로 대체합니다.', apiEndpoint: '/api/preprocess/missing/mean' },
      { id: 'median', name: '중앙값으로 대체', description: '결측치를 해당 컬럼의 중앙값으로 대체합니다.', apiEndpoint: '/api/preprocess/missing/median' },
      { id: 'mode', name: '최빈값으로 대체', description: '결측치를 해당 컬럼의 최빈값으로 대체합니다.', apiEndpoint: '/api/preprocess/missing/mode' },
      { id: 'drop-rows', name: '결측치가 있는 행 제거', description: '결측치를 포함한 행 전체를 삭제합니다.', apiEndpoint: '/api/preprocess/missing/drop-rows' },
      { id: 'drop-columns', name: '결측치가 있는 열 제거', description: '결측치를 포함한 컬럼 전체를 삭제합니다.', apiEndpoint: '/api/preprocess/missing/drop-columns' },
    ],
  },
  {
    id: 'outlier-detection',
    name: '이상치 탐지',
    icon: '🔍',
    description: '데이터의 너무 크거나 작은 값이 이상치인지 확인합니다.',
    options: [
      { id: 'z-score', name: 'Z-점수 기반 탐지', description: '평균과 표준편차를 이용해 임계값을 초과하는 값을 이상치로 탐지합니다.', apiEndpoint: '/api/preprocess/outlier/detect/z-score' },
      { id: 'iqr', name: 'IQR 기반 탐지', description: '사분위 범위(IQR)를 기준으로 이상치를 탐지합니다.', apiEndpoint: '/api/preprocess/outlier/detect/iqr' },
    ],
  },
  {
    id: 'outlier-handle',
    name: '이상치 처리',
    icon: '🛠️',
    description: '탐지된 이상치를 제거하거나 적절한 값으로 대체합니다.',
    options: [
      { id: 'remove', name: '이상치 제거', description: '탐지된 이상치가 포함된 행을 삭제합니다.', apiEndpoint: '/api/preprocess/outlier/remove' },
      { id: 'replace', name: '이상치 대체', description: '탐지된 이상치를 해당 컬럼의 최소값 또는 최대값으로 대체합니다.', apiEndpoint: '/api/preprocess/outlier/replace' },
    ],
  },
  {
    id: 'data-transformation',
    name: '데이터 변환',
    icon: '🔁',
    description: '숫자 크기를 조정해서 비교하기 쉽게 만들어 줍니다.',
    options: [
      { id: 'min-max', name: 'Min-Max 정규화', description: '값을 최소값과 최대값을 기준으로 0~1 범위로 정규화합니다.', apiEndpoint: '/api/preprocess/transform/min-max' },
      { id: 'z-score', name: 'Z-점수 표준화', description: '값을 평균 0, 표준편차 1로 표준화합니다.', apiEndpoint: '/api/preprocess/transform/z-score' },
      { id: 'log', name: '로그 변환', description: '값에 로그를 적용하여 분포의 왜곡을 줄입니다.', apiEndpoint: '/api/preprocess/transform/log' },
      { id: 'sqrt', name: '제곱근 변환', description: '값에 제곱근을 적용하여 스케일을 조정합니다.', apiEndpoint: '/api/preprocess/transform/sqrt' },
    ],
  },
  {
    id: 'categorical-encoding',
    name: '범주형 변수 인코딩',
    icon: '🧮',
    description: '문자형 데이터를 숫자형으로 변환합니다.',
    options: [
      { id: 'one-hot', name: '원-핫 인코딩', description: '범주형 값을 0과 1로 구성된 이진 벡터로 변환합니다.', apiEndpoint: '/api/preprocess/encoding/one-hot' },
      { id: 'label', name: '레이블 인코딩', description: '범주형 값을 정수(0, 1, 2...)로 변환합니다.', apiEndpoint: '/api/preprocess/encoding/label' },
      { id: 'target', name: '타겟 인코딩', description: '각 범주를 해당 클래스의 평균 타겟값으로 변환합니다.', apiEndpoint: '/api/preprocess/encoding/target' },
    ],
  },
  {
    id: 'class-imbalance',
    name: '클래스 불균형 처리',
    icon: '⚖️',
    description: '데이터 양이 다른 그룹들을 균형 있게 맞춥니다.',
    options: [
      { id: 'smote', name: 'SMOTE 오버샘플링', description: '적은 클래스의 데이터를 합성하여 클래스 비율을 균형 있게 만듭니다.', apiEndpoint: '/api/preprocess/imbalance/smote' },
      { id: 'under', name: '언더샘플링 적용', description: '과대표집된 클래스의 데이터를 줄여 클래스 균형을 맞춥니다.', apiEndpoint: '/api/preprocess/imbalance/under' },
      { id: 'weights', name: '클래스 가중치 조정', description: '학습 시 손실 함수에 클래스별 가중치를 적용하여 균형을 맞춥니다.', apiEndpoint: '/api/preprocess/imbalance/weights' },
    ],
  },
];

const PreprocessingOptions = () => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleSelect = async (categoryId: string, option: PreprocessingOption) => {
    setLoading(true);
    try {
      // 실제 API 요청 로직을 여기에
      // await axiosInstance.post(option.apiEndpoint, { ... })
      setSelected((prev) => ({ ...prev, [categoryId]: option.id }));
    } catch (e) {
      console.error('전처리 실패', e);
    } finally {
      setLoading(false);
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
              {cat.options.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(cat.id, opt)}
                  className={`flex items-center justify-between p-3 pl-4 text-sm transition-colors duration-200 ${selected[cat.id] === opt.id ? 'bg-blue-50' : 'hover:bg-[theme(color-gray-05)]'}`}
                >
                  <div>
                    <p className="text-sm font-semibold">{opt.name}</p>
                    <p className="text-xs text-[var(--color-gray-01)]">{opt.description}</p>
                  </div>

                  {selected[cat.id] === opt.id && <Check size={16} className="text-blue-500" />}
                </div>
              ))}
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
