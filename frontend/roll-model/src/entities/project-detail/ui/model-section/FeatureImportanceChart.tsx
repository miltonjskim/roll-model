'use client';

import { FeatureImportance } from '@/entities/project-detail/model/ModelTypes';
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface FeatureImportanceChartProps {
  featureImportance: FeatureImportance[];
}

export default function FeatureImportanceChart({ featureImportance }: FeatureImportanceChartProps) {
  // 전체 보기 상태 추가
  const [showAll, setShowAll] = useState(false);

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

  // 가장 긴 컬럼명의 길이 계산
  const tempLength = useMemo(() => {
    if (!sortedData.length) return 0;
    return Math.max(...sortedData.map((item) => item.featureName.length));
  }, [sortedData]);

  // 표시할 데이터 (showAll이 true면 전체, false면 최대 8개)
  const displayData = useMemo(() => {
    return showAll ? sortedData : sortedData.slice(0, 8);
  }, [sortedData, showAll]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">{data.featureName}</p>
          <p className="text-[theme(color-blue-01)] font-medium">중요도: {data.importanceValue}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`mb-3 text-start text-lg font-semibold`}>특성 중요도</h2>
          <p className={`text-[theme(color-muted-foreground)] mb-3 text-start text-sm`}>모델의 예측에 각 특성이 미치는 영향력을 보여줍니다. 막대가 길수록 모델 예측에 더 중요한 역할을 합니다.</p>
        </div>

        {/* 자세히 보기 버튼 (컬럼이 8개 초과일 때만 표시) */}
        {sortedData.length > 8 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="border-[theme(color-gray-04)] text-[theme(primary-black)] text-md hover:text-[theme(primary-white)] hover:bg-[theme(primary-black)] mt-2 h-[3rem] w-full cursor-pointer rounded-md border border-1 font-semibold shadow-sm transition-all duration-300 ease-in-out select-none"
            >
              {showAll ? '간략히 보기' : `더보기`}
            </button>
          </div>
        )}
      </div>

      <section className="bg-[theme(color-card-background)] rounded-lg border p-6 shadow-sm">
        {featureImportance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <h3 className="mb-2 text-lg font-medium text-gray-700">특성 중요도 데이터가 없습니다</h3>
            <p className="text-center text-sm text-gray-500">
              현재 모델 유형에서는 특성 중요도를 제공하지 않거나 계산할 수 없습니다. <br />
              특성 중요도는 일부 모델(예: 결정 트리, 랜덤 포레스트, 부스팅 모델 등)에서만 제공됩니다.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            {/* 차트 */}
            <ResponsiveContainer width="100%" height={Math.max(300, displayData.length * 40)}>
              <BarChart data={displayData} layout="vertical" margin={{ top: 10, right: 100, left: -40 + tempLength * 6, bottom: 10 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e8eaec" />
                <XAxis type="number" domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} tickFormatter={(value) => `${value}%`} tickCount={5} stroke="#7d818a" fontSize={11} />
                <YAxis type="category" dataKey="featureName" width={tempLength * 6 + 20} tick={{ fontSize: 12, fill: '#181d2b', fontWeight: 500 }} stroke="#e8eaec" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(114, 150, 245, 0.1)' }} />
                <Bar dataKey="value" name="중요도" fill="#181d2b" radius={[0, 4, 4, 0]} animationDuration={1500} animationEasing="ease-out">
                  <LabelList dataKey="importanceValue" position="right" style={{ fill: '#181d2b', fontWeight: 600, fontSize: 12 }} formatter={(value: string) => `${value}`} offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 아래설명(필요없음) */}
        {sortedData.length > 0 && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700">인사이트</h3>
            <p className="text-[theme(color-muted-foreground)] mt-2 text-sm">
              <span className="text-[theme(color-blue-01)] font-medium">{sortedData[0].featureName}</span>이(가)
              {sortedData.length > 1 ? (
                <span>
                  <span className="text-[theme(color-blue-01)] font-medium">{sortedData[0].importanceValue}%</span>로 가장 중요한 특성으로 나타났으며, 이는 두 번째로 중요한 특성인
                  <span className="text-[theme(color-blue-01)] font-medium">
                    {sortedData[1].featureName}({sortedData[1].importanceValue}%)
                  </span>
                  보다
                  <span className="text-[theme(color-blue-01)] font-medium">
                    {(parseFloat(sortedData[0].importanceValue.replace('%', '')) - parseFloat(sortedData[1].importanceValue.replace('%', ''))).toFixed(1)}%p
                  </span>
                  높습니다.
                </span>
              ) : (
                <span>
                  <span className="text-[theme(color-blue-01)] font-medium">{sortedData[0].importanceValue}</span>로 가장 중요한 특성으로 나타났습니다.
                </span>
              )}
            </p>

            {sortedData.length >= 4 && (
              <p className="mt-2 text-sm text-gray-600">
                상위 3개 특성(
                <span className="text-[theme(color-blue-01)] font-medium">
                  {sortedData
                    .slice(0, 3)
                    .map((d) => d.featureName)
                    .join(', ')}
                </span>
                )이 전체 중요도의 약
                <span className="text-[theme(color-blue-01)] font-medium">
                  {sortedData
                    .slice(0, 3)
                    .reduce((sum, item) => sum + parseFloat(item.importanceValue.replace('%', '')), 0)
                    .toFixed(1)}
                  %
                </span>
                를 차지하고 있어 모델 예측에 큰 영향을 미치고 있습니다.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
