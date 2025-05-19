// /entities/project-detail/ui/DistributionCharts.tsx
import { Distribution } from '@/entities/project-detail/model/dataTypes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/shared/lib/utils/formatNumber'; // formatNumber 함수 import 경로는 실제 위치에 맞게 조정하세요

interface DistributionChartsProps {
  distributions: Distribution[];
}

export const DistributionCharts = ({ distributions }: DistributionChartsProps) => {
  // 차트 데이터 변환 함수
  const transformDistributionData = (distribution: Distribution) => {
    return distribution.xAxis.values.map((x, i) => ({
      x: typeof x === 'number' ? parseFloat(x.toFixed(2)) : x,
      count: distribution.yAxis.values[i],
      // 원본 값도 저장 (Tooltip에서 활용)
      rawX: x,
      rawCount: distribution.yAxis.values[i],
    }));
  };
  const barColorIndex = ['var(--color-blue-02)', 'var(--color-yellow-02)', 'var(--color-green-02)', 'var(--color-pink-02)'];

  // Custom Tooltip 구성
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-sm">
          <p className="label">{`${payload[0].payload.rawX}`}</p>
          <p className="value">{`${payload[0].name}: ${formatNumber(payload[0].payload.rawCount)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[theme(color-card)] mb-4 rounded-lg p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {distributions.map((dist, index) => (
          <div key={index} className="bg-[theme(color-card-background)] rounded p-3">
            <h3 className="text-md mb-2 font-medium">{dist.name}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transformDistributionData(dist)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-04)" />
                  <Tooltip
                    content={<CustomTooltip />}
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                  <Bar dataKey="count" fill={`${barColorIndex[index]}`} />
                  <XAxis
                    dataKey="x"
                    label={{
                      value: dist.xAxis.label,
                      position: 'insideBottom',
                      offset: -5,
                    }}
                    tick={{ fill: 'var(--color-gray-01)' }}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <YAxis
                    label={{
                      value: dist.yAxis.label,
                      angle: -90,
                      position: 'insideLeft',
                    }}
                    tick={{ fill: 'var(--color-gray-01)' }}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
