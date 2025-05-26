'use client';

import { ModelParameter, TargetInfo, PerformanceMetric } from '@/entities/project-detail/model/ModelTypes';
import { CLASSIFICATION_MODELS, REGRESSION_MODELS } from '@/shared/api/mocks/modeling/modelingData';
//
import { MdBubbleChart } from 'react-icons/md'; // <MdBubbleChart />
import { FaSearch } from 'react-icons/fa'; // <FaSearch />
import { IoExtensionPuzzle } from 'react-icons/io5'; // <IoExtensionPuzzle />
import { MdTimer } from 'react-icons/md'; // <MdTimer />
import { FaChartLine } from 'react-icons/fa6'; // <FaChartLine />
import { GiArcheryTarget } from 'react-icons/gi'; // <GiArcheryTarget />
import { FaBalanceScale } from 'react-icons/fa'; // <FaBalanceScale />
//

interface ModelOverviewProps {
  category: string;
  algorithmName: string;
  koreanModelName: string;
  modelParameters: ModelParameter[];
  targetInfo: TargetInfo[];
  performanceMetrics: PerformanceMetric[];
}

export default function ModelOverview({ category, algorithmName, koreanModelName, modelParameters, targetInfo, performanceMetrics }: ModelOverviewProps) {
  // 모델 설명 찾기
  const modelInfo = category === 'CLASSIFICATION' ? CLASSIFICATION_MODELS.find((model) => model.id === algorithmName) : REGRESSION_MODELS.find((model) => model.id === algorithmName);
  const description = modelInfo?.description;

  // 모델 정보와 성능 지표 카드 데이터
  const modelInfoCards = [
    {
      name: modelParameters[0].parameterName,
      value: modelParameters[0].parameterValue,
      bg: 'bg-[theme(color-blue-03)]',
      textColor: 'text-blue-700', // text-[var(--color-blue-01)] 안예쁨
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

  const performanceCards = [
    {
      name: performanceMetrics[0].metricName,
      value: performanceMetrics[0].metricValue,
      description: performanceMetrics[0].metricDesc,
      bg: 'bg-[theme(color-blue-03)]',
      textColor: 'text-blue-700',
      icon: <FaChartLine className="text-lg" />,
    },
    {
      name: performanceMetrics[1].metricName,
      value: performanceMetrics[1].metricValue,
      description: performanceMetrics[1].metricDesc,
      bg: 'bg-[theme(color-yellow-03)]',
      textColor: 'text-yellow-700',
      icon: <GiArcheryTarget className="text-lg" />,
    },
    {
      name: performanceMetrics[2].metricName,
      value: performanceMetrics[2].metricValue,
      description: performanceMetrics[2].metricDesc,
      bg: 'bg-[theme(color-green-03)]',
      textColor: 'text-green-700',
      icon: <FaSearch className="text-lg" />,
    },
    {
      name: performanceMetrics[3].metricName,
      value: performanceMetrics[3].metricValue,
      description: performanceMetrics[3].metricDesc,
      bg: 'bg-[theme(color-rose-03)]',
      textColor: 'text-rose-700',
      icon: <FaBalanceScale className="text-lg" />,
    },
  ];

  return (
    <section className="space-y-6">
      {/* 모델 정보 섹션 */}
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

      {/* 성능 지표 섹션 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-gray-800">모델 성능 한눈에 보기</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {performanceCards.map((card, index) => (
            <div key={`metric-${index}`} className={`flex flex-col rounded-lg ${card.bg} p-4 transition-all hover:shadow-md`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{card.name}</span>
                <span className="text-lg">{card.icon}</span>
              </div>
              <div className={`mb-1 text-2xl font-bold ${card.textColor}`}>{card.value}</div>
              <div className="text-xs text-gray-500">{card.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
