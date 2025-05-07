'use client';

import { FeatureImportance } from '@/entities/project-detail/model/ModelTypes';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface FeatureImportanceChartProps {
  featureImportance: FeatureImportance[];
}

export default function FeatureImportanceChart({ featureImportance }: FeatureImportanceChartProps) {
  // 데이터 정렬 및 변환
  const sortedData = useMemo(() => {
    // 퍼센트 문자열을 숫자로 변환
    const parsedData = featureImportance.map((item) => ({
      ...item,
      // '%' 문자 제거하고 숫자로 변환
      value: parseFloat(item.importanceValue.replace('%', '')),
    }));

    // 중요도 기준 내림차순 정렬
    return parsedData.sort((a, b) => b.value - a.value);
  }, [featureImportance]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">{data.featureName}</p>
          <p className="font-medium text-indigo-600">중요도: {data.importanceValue}</p>
          <p className="mt-1 text-xs text-gray-500">키: {data.importanceKey}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">특성 중요도</h2>
      <p className="mb-4 text-sm text-gray-500">모델의 예측에 각 특성이 미치는 영향력을 보여줍니다. 막대가 길수록 모델 예측에 더 중요한 역할을 합니다.</p>
      {/* 차트 */}
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={Math.max(300, sortedData.length * 40)}>
          <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 80, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={(value) => `${value}%`} tickCount={6} />
            <YAxis type="category" dataKey="featureName" width={100} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="중요도" fill="#181d2b">
              <LabelList dataKey="importanceValue" position="right" style={{ fill: '#374151', fontWeight: 500, fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* 아래설명(필요없음) */}
      {sortedData.length > 0 && (
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700">인사이트</h3>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-indigo-600">{sortedData[0].featureName}</span>이(가)
            {sortedData.length > 1
              ? ` ${sortedData[0].importanceValue}로 가장 중요한 특성으로 나타났으며, 이는 두 번째로 중요한 특성인 ${sortedData[1].featureName}(${sortedData[1].importanceValue})보다 ${(parseFloat(sortedData[0].importanceValue.replace('%', '')) - parseFloat(sortedData[1].importanceValue.replace('%', ''))).toFixed(1)}%p 높습니다.`
              : ` ${sortedData[0].importanceValue}로 가장 중요한 특성으로 나타났습니다.`}
          </p>

          {sortedData.length >= 4 && (
            <p className="mt-2 text-sm text-gray-600">
              상위 3개 특성(
              {sortedData
                .slice(0, 3)
                .map((d) => d.featureName)
                .join(', ')}
              )이 전체 중요도의 약{' '}
              {sortedData
                .slice(0, 3)
                .reduce((sum, item) => sum + parseFloat(item.importanceValue.replace('%', '')), 0)
                .toFixed(1)}
              %를 차지하고 있어 모델 예측에 큰 영향을 미치고 있습니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
