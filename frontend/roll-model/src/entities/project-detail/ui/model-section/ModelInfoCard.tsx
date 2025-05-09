'use client';

import { ModelParameter, TargetInfo } from '@/entities/project-detail/model/ModelTypes';
import { CLASSIFICATION_MODELS, REGRESSION_MODELS } from '@/shared/api/mocks/modeling/modelingData';
import { MdBubbleChart } from 'react-icons/md';
import { FaSearch } from 'react-icons/fa';
import { IoExtensionPuzzle } from 'react-icons/io5';
import { MdTimer } from 'react-icons/md';

interface ModelInfoCardProps {
  category: string;
  algorithmName: string;
  koreanModelName: string;
  modelParameters: ModelParameter[];
  targetInfo: TargetInfo[];
}

export default function ModelInfoCard({ category, algorithmName, koreanModelName, modelParameters, targetInfo }: ModelInfoCardProps) {
  // 모델 설명 찾기
  const modelInfo = category === 'CLASSIFICATION' 
    ? CLASSIFICATION_MODELS.find((model) => model.id === algorithmName) 
    : REGRESSION_MODELS.find((model) => model.id === algorithmName);
  const description = modelInfo?.description;

  // 모델 정보 카드 데이터
  const modelInfoCards = [
    {
      name: modelParameters[0].parameterName,
      value: modelParameters[0].parameterValue,
      bg: 'bg-[theme(color-blue-03)]',
      textColor: 'text-blue-700',
      icon: <MdBubbleChart className="text-lg" />,
    },
    {
      name: modelParameters[1].parameterName,
      value: modelParameters[1].parameterValue,
      bg: 'bg-[theme(color-yellow-03)]',
      textColor: 'text-yellow-700',
      icon: <FaSearch className="text-lg" />,
    },
    {
      name: targetInfo[0].targetName,
      value: targetInfo[0].targetValue,
      bg: 'bg-[theme(color-green-03)]',
      textColor: 'text-green-700',
      icon: <IoExtensionPuzzle className="text-lg" />,
    },
    {
      name: targetInfo[1].durationName,
      value: targetInfo[1].durationValue,
      bg: 'bg-[theme(color-rose-03)]',
      textColor: 'text-rose-700',
      icon: <MdTimer className="text-lg" />,
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{koreanModelName}</h2>
          <p className="mt-1 text-sm text-gray-500">{category === 'CLASSIFICATION' ? '분류' : '회귀'} 모델</p>
        </div>
        <div className="rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700">{algorithmName}</div>
      </div>

      <p className="mb-6 text-gray-600">{description}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modelInfoCards.map((card, index) => (
          <div key={`info-${index}`} className={`flex flex-col rounded-lg ${card.bg} p-4 transition-all hover:shadow-md`}>
            <div className="mb-2 flex items-center">
              <span className="mr-2 text-lg">{card.icon}</span>
              <span className="text-sm text-gray-600">{card.name}</span>
            </div>
            <div className={`text-lg font-semibold ${card.textColor}`}>{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}