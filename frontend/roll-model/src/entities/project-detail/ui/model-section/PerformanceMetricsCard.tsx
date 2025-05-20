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
            {/* <div className="mt-1 ml-1 text-start text-sm text-gray-500">{performanceMetrics[0]?.metricDesc || ''}</div> */}
            <div className="mt-1 ml-1 text-start text-sm text-gray-500">
              {performanceMetrics[0]?.metricName === 'R² (결정 계수)'
                ? '정확도 점수 : (-100%~100%) 값이 높을수록 예측이 정확합니다. 0% 미만은 모델이 개선이 필요함을 의미합니다.'
                : performanceMetrics[0]?.metricDesc || ''}
            </div>
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
            {/* <div className="mt-1 ml-1 text-start text-sm text-gray-500">{performanceMetrics[1]?.metricDesc || ''}</div> */}

            <div className="mt-1 ml-1 text-start text-sm text-gray-500">
              {performanceMetrics[1]?.metricName === 'MAE (평균 절대 오차)'
                ? '평균 오차 크기 : 예측이 실제값에서 평균적으로 얼마나 벗어났는지 보여줍니다. 작을수록 좋습니다.'
                : performanceMetrics[1]?.metricDesc || ''}
            </div>
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
            {/* <div className="mt-1 ml-1 text-start text-sm text-gray-500">{performanceMetrics[2]?.metricDesc || ''}</div> */}
            {/* MSE (평균 제곱 오차) */}
            <div className="mt-1 ml-1 text-start text-sm text-gray-500">
              {performanceMetrics[2]?.metricName === 'MSE (평균 제곱 오차)'
                ? '오차의 심각도 : 큰 오차에 더 많은 불이익을 주는 점수입니다. 작을수록 좋습니다.'
                : performanceMetrics[2]?.metricDesc || ''}
            </div>
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
            {/* <div className="mt-1 ml-1 text-start text-sm text-gray-500">{performanceMetrics[3]?.metricDesc || ''}</div> */}
            <div className="mt-1 ml-1 text-start text-sm text-gray-500">
              {performanceMetrics[3]?.metricName === 'RMSE (평균 제곱근 오차)'
                ? '실제 단위로 본 오차 : 원래 데이터와 같은 단위로 표현된 오차입니다. 작을수록 좋아요'
                : performanceMetrics[3]?.metricDesc || ''}
            </div>
          </div>
          <div className="font-tossface mt-1 mr-1 text-2xl lg:text-3xl">{performanceMetrics[3]?.metricKey && getMetricEmoji(performanceMetrics[3].metricKey, category)}</div>
        </div>
      </div>
    </div>
  );
}
