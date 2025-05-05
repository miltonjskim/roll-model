// /entities/project-detail/ui/DistributionCharts.tsx
import { Distribution } from "@/entities/project-detail/model/dataTypes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DistributionChartsProps {
  distributions: Distribution[];
}

export const DistributionCharts = ({
  distributions,
}: DistributionChartsProps) => {
  // 차트 데이터 변환 함수
  const transformDistributionData = (distribution: Distribution) => {
    return distribution.xAxis.values.map((x, i) => ({
      x,
      count: distribution.yAxis.values[i],
    }));
  };

  return (
    <div className="bg-[theme(color-card)] p-4 rounded-lg shadow-sm mb-4">
      <h2 className="text-lg font-semibold mb-3">주요 변수 분포</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {distributions.map((dist, index) => (
          <div key={index} className="bg-[theme(color-gray-05)] p-3 rounded">
            <h3 className="text-md font-medium mb-2">{dist.name}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transformDistributionData(dist)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-gray-04)"
                  />
                  <XAxis
                    dataKey="x"
                    label={{
                      value: dist.xAxis.label,
                      position: "insideBottom",
                      offset: -5,
                    }}
                    tick={{ fill: "var(--color-gray-01)" }}
                  />
                  <YAxis
                    label={{
                      value: dist.yAxis.label,
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fill: "var(--color-gray-01)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
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
