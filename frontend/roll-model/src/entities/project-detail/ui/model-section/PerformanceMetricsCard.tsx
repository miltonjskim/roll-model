'use client';

import { PerformanceMetric } from '@/entities/project-detail/model/ModelTypes';
import { getMetricEmoji } from '@/shared/api/mocks/modeling/modelingEmoji';
import { formatNumber } from '@/shared/lib/utils/formatNumber';
import { CssDetailHovering } from '@/widgets/project/project-detail/ProjectDetailCard';

interface PerformanceMetricsCardProps {
  performanceMetrics: PerformanceMetric[];
  category: 'CLASSIFICATION' | 'REGRESSION'; // 메트릭 타입(분류/회귀)을 위해 추가
}

export default function PerformanceMetricsCard({ performanceMetrics, category }: PerformanceMetricsCardProps) {
  // 카드 호버 효과를 위한 CSS 클래스

  // 메트릭 값을 포맷팅하는 함수
  const formatMetricValue = (value: string | number | undefined) => {
    if (!value) return '-';

    // 숫자인 경우 소수점 4자리까지 표시
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      return numValue.toFixed(2);
    }

    return value;
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 첫번째카드 */}
        <div className={`bg-[theme(color-blue-03)] hover:bg-[theme(color-blue-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
          <div className="flex flex-col">
            <div className="h-[1.5rem] text-start text-sm font-medium text-gray-600">{performanceMetrics[0]?.metricName || '-'}</div>
            <div className="text-start text-xl font-bold text-blue-700 lg:text-2xl">{formatMetricValue(performanceMetrics[0]?.metricValue)}</div>
            <div className="mt-1 text-xs text-gray-500">{performanceMetrics[0]?.metricDesc || ''}</div>
          </div>
          <div className="font-tossface mt-1 mr-1 text-2xl lg:text-3xl">{performanceMetrics[0]?.metricKey && getMetricEmoji(performanceMetrics[0].metricKey, category)}</div>
        </div>

        {/* 두번째카드 */}
        <div className={`bg-[theme(color-yellow-03)] hover:bg-[theme(color-yellow-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
          <div className="flex flex-col">
            <div className="h-[1.5rem] text-start text-sm font-medium text-gray-600">{performanceMetrics[1]?.metricName || '-'}</div>
            <div className="text-start text-xl font-bold text-yellow-700 lg:text-2xl">
              {performanceMetrics[1]?.metricValue !== undefined ? formatNumber(parseFloat(performanceMetrics[1].metricValue)) : '-'}
            </div>
            <div className="mt-1 text-xs text-gray-500">{performanceMetrics[1]?.metricDesc || ''}</div>
          </div>
          <div className="font-tossface mt-1 mr-1 text-2xl lg:text-3xl">{performanceMetrics[1]?.metricKey && getMetricEmoji(performanceMetrics[1].metricKey, category)}</div>
        </div>

        {/* 세번째카드 */}
        <div className={`bg-[theme(color-green-03)] hover:bg-[theme(color-green-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
          <div className="flex flex-col">
            <div className="h-[1.5rem] text-start text-sm font-medium text-gray-600">{performanceMetrics[2]?.metricName || '-'}</div>
            <div className="text-start text-xl font-bold text-green-700 lg:text-2xl">
              {performanceMetrics[2]?.metricValue !== undefined ? formatNumber(parseFloat(performanceMetrics[2].metricValue)) : '-'}
            </div>
            <div className="mt-1 text-xs text-gray-500">{performanceMetrics[2]?.metricDesc || ''}</div>
          </div>
          <div className="font-tossface mt-1 mr-1 text-2xl lg:text-3xl">{performanceMetrics[2]?.metricKey && getMetricEmoji(performanceMetrics[2].metricKey, category)}</div>
        </div>

        {/* 네번째카드 */}
        <div className={`bg-[theme(color-rose-03)] hover:bg-[theme(color-rose-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
          <div className="flex flex-col">
            <div className="h-[1.5rem] text-start text-sm font-medium text-gray-600">{performanceMetrics[3]?.metricName || '-'}</div>
            <div className="text-start text-xl font-bold text-rose-700 lg:text-2xl">
              {performanceMetrics[3]?.metricValue !== undefined ? formatNumber(parseFloat(performanceMetrics[3].metricValue)) : '-'}
            </div>
            <div className="mt-1 text-xs text-gray-500">{performanceMetrics[3]?.metricDesc || ''}</div>
          </div>
          <div className="font-tossface mt-1 mr-1 text-2xl lg:text-3xl">{performanceMetrics[3]?.metricKey && getMetricEmoji(performanceMetrics[3].metricKey, category)}</div>
        </div>
      </div>
    </div>
  );
}
