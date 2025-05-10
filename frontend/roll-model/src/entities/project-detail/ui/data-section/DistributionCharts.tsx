// /entities/project-detail/ui/DistributionCharts.tsx
import { Distribution } from '@/entities/project-detail/model/dataTypes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DistributionChartsProps {
  distributions: Distribution[];
}

export const DistributionCharts = ({ distributions }: DistributionChartsProps) => {
  // 차트 데이터 변환 함수
  const transformDistributionData = (distribution: Distribution) => {
    return distribution.xAxis.values.map((x, i) => ({
      x: typeof x === 'number' ? parseFloat(x.toFixed(2)) : x,
      count: distribution.yAxis.values[i],
    }));
  };

  return (
    <div className="bg-[theme(color-card)] mb-4 rounded-lg p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">주요 변수 분포</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {distributions.map((dist, index) => (
          <div key={index} className="bg-[theme(color-gray-05)] rounded p-3">
            <h3 className="text-md mb-2 font-medium">{dist.name}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transformDistributionData(dist)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-04)" />
                  <XAxis
                    dataKey="x"
                    label={{
                      value: dist.xAxis.label,
                      position: 'insideBottom',
                      offset: -5,
                    }}
                    tick={{ fill: 'var(--color-gray-01)' }}
                  />
                  <YAxis
                    label={{
                      value: dist.yAxis.label,
                      angle: -90,
                      position: 'insideLeft',
                    }}
                    tick={{ fill: 'var(--color-gray-01)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-purple-01)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
