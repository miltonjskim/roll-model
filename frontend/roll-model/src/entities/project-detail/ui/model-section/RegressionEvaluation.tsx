'use client';

import { ActualVsPredicted, ResidualPlot } from '@/entities/project-detail/model/ModelTypes';
import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, Area, Legend, BarChart, Bar } from 'recharts';

interface RegressionEvaluationProps {
  actualVsPredicted: ActualVsPredicted;
  residualPlot: ResidualPlot;
}

export default function RegressionEvaluation({ actualVsPredicted, residualPlot }: RegressionEvaluationProps) {
  // 실제값과 예측값의 최소, 최대값 찾기
  const actualVsPredictedRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    // 실제값과 예측값 모두 고려하여 범위 계산
    actualVsPredicted?.data.forEach((item) => {
      min = Math.min(min, item.actual, item.predicted);
      max = Math.max(max, item.actual, item.predicted);
    });

    // 약간의 여유 공간 추가
    const padding = (max - min) * 0.05;
    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding),
    };
  }, [actualVsPredicted?.data]);

  // 잔차 데이터의 최소, 최대값 찾기
  const residualRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    residualPlot?.data.forEach((item) => {
      min = Math.min(min, item.residual);
      max = Math.max(max, item.residual);
    });

    // 약간의 여유 공간 추가
    const padding = (max - min) * 0.05;
    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding),
    };
  }, [residualPlot?.data]);

  // 히스토그램 데이터 가공
  const histogramData = useMemo(() => {
    return residualPlot?.histogram.bins.map((bin, index) => ({
      bin,
      frequency: residualPlot?.histogram.frequencies[index],
    }));
  }, [residualPlot?.histogram]);

  // 커스텀 툴팁 - 실제값 vs 예측값
  const ActualVsPredictedTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          {/* <p className="text-sm text-gray-500">데이터 ID: {data.id}</p> */}
          <p className="text-[theme(color-blue-01)] text-sm font-medium">실제값: {data.actual.toFixed(2)}</p>
          <p className="text-[theme(color-purple-01)] text-sm font-medium">예측값: {data.predicted.toFixed(2)}</p>
          <p className="text-[theme(color-muted-foreground)] mt-1 text-xs">오차: {(data.actual - data.predicted).toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  // 커스텀 툴팁 - 잔차 플롯
  const ResidualTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          {/* <p className="text-sm text-gray-500">데이터 ID: {data.id}</p> */}
          <p className="text-[theme(color-purple-01)] text-sm font-medium">예측값: {data.predicted.toFixed(2)}</p>
          <p className="text-[theme(color-rose-01)] text-sm font-medium">잔차: {data.residual.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  // 히스토그램 툴팁
  const HistogramTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-[theme(color-muted-foreground)] text-sm font-medium">잔차 구간: {data.bin.toFixed(2)}</p>
          <p className="text-sm font-medium text-blue-600">빈도: {data.frequency}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="mb-4 rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-start text-lg font-semibold">모델 평가</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 실제값 vs 예측값 차트 */}
        <div className="flex flex-col">
          <h3 className="text-[theme(primary-black)] mb-3 text-lg font-medium">실제값 vs 예측값</h3>
          <p className="text-[theme(color-muted-foreground)] text-sm">모델이 예측한 값과 실제 값의 관계를 보여줍니다.</p>
          <p className="text-[theme(color-muted-foreground)] mb-4 text-sm">점들이 대각선 (완벽한 예측)에 가까울수록 모델 성능이 우수합니다.</p>

          {actualVsPredicted && (
            <div className="bg-[theme(color-card-background)] mt-2 h-80 w-full rounded-lg border border-gray-200 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="predicted"
                    name="예측값"
                    domain={[actualVsPredictedRange.min, actualVsPredictedRange.max]}
                    label={{ value: actualVsPredicted.xAxisLabel || '예측값', position: 'bottom', offset: 0 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="actual"
                    name="실제값"
                    domain={[actualVsPredictedRange.min, actualVsPredictedRange.max]}
                    label={{ value: actualVsPredicted.yAxisLabel || '실제값', angle: -90, position: 'left', offset: 0 }}
                  />
                  <Tooltip content={<ActualVsPredictedTooltip />} />
                  <ReferenceLine
                    segment={[
                      { x: actualVsPredictedRange.min, y: actualVsPredictedRange.min },
                      { x: actualVsPredictedRange.max, y: actualVsPredictedRange.max },
                    ]}
                    stroke="#4f46e5"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                  />
                  <Scatter name="실제 vs 예측" data={actualVsPredicted.data} fill="#7c3aed" opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 잔차 플롯 및 히스토그램 */}
        <div className="flex flex-col">
          <h3 className="text-[theme(primary-black)] mb-3 text-lg font-medium">잔차 분석</h3>
          <p className="text-[theme(color-muted-foreground)] text-sm">예측값과 실제값의 차이(잔차)를 분석합니다.</p>
          <p className="text-[theme(color-muted-foreground)] mb-4 text-sm">잔차가 0 주변에 무작위로 분포할수록 모델이 편향되지 않았음을 의미합니다.</p>
          {residualPlot && (
            <div className="bg-[theme(color-card-background)] mt-2 h-48 w-full rounded-lg border border-gray-200 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="predicted" name="예측값" label={{ value: residualPlot.xAxisLabel || '예측값', position: 'bottom', offset: 0 }} />
                  <YAxis
                    type="number"
                    dataKey="residual"
                    name="잔차"
                    domain={[residualRange.min, residualRange.max]}
                    label={{ value: residualPlot.yAxisLabel || '잔차', angle: -90, position: 'left', offset: 0 }}
                  />
                  <ReferenceLine y={0} stroke="#4f46e5" strokeWidth={1} />
                  <Tooltip content={<ResidualTooltip />} />
                  <Scatter name="잔차" data={residualPlot.data} fill="#ef4444" opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {histogramData && (
            <div className="bg-[theme(color-card-background)] mt-4 h-32 w-full rounded-lg border border-gray-200 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bin" label={{ value: '잔차 분포', position: 'bottom', offset: 0 }} tickFormatter={(value) => value.toFixed(2)} />
                  <YAxis label={{ value: '빈도', angle: -90, position: 'left', offset: 0 }} />
                  <Tooltip content={<HistogramTooltip />} />
                  <Bar dataKey="frequency" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
