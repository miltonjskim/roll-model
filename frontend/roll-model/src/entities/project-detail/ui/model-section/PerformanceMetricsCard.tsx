'use client';

import { PerformanceMetric } from '@/entities/project-detail/model/ModelTypes';
import { FaChartLine } from 'react-icons/fa6';
import { GiArcheryTarget } from 'react-icons/gi';
import { FaSearch } from 'react-icons/fa';
import { FaBalanceScale } from 'react-icons/fa';

interface PerformanceMetricsCardProps {
  performanceMetrics: PerformanceMetric[];
}

export default function PerformanceMetricsCard({ performanceMetrics }: PerformanceMetricsCardProps) {
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
  );
}