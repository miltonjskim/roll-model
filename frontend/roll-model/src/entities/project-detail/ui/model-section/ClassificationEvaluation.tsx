'use client';

import { ConfusionMatrix } from '@/entities/project-detail/model/ModelTypes';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, Tooltip, Cell, ScatterChart, Scatter, XAxis, YAxis, ZAxis } from 'recharts';

interface ClassificationEvaluationProps {
  confusionMatrix: ConfusionMatrix;
}

export default function ClassificationEvaluation({ confusionMatrix }: ClassificationEvaluationProps) {
  const { labels, matrixData } = confusionMatrix;

  // 혼동 행렬 데이터를 recharts 형식으로 변환
  const chartData = useMemo(() => {
    const data = [];
    let maxCount = 0;

    for (let i = 0; i < matrixData.length; i++) {
      for (let j = 0; j < matrixData[i].length; j++) {
        const count = matrixData[i][j];
        maxCount = Math.max(maxCount, count);

        data.push({
          x: j, // 예측 클래스 (x축)
          y: labels.length - 1 - i, // 실제 클래스 (y축) - 방향 뒤집기
          z: count, // 값 (원 크기)
          actualLabel: labels[i],
          predictedLabel: labels[j],
          isCorrect: i === j,
        });
      }
    }

    return { data, maxCount };
  }, [matrixData, labels]);

  // 모델 정확도 계산 (대각선 합 / 전체 합)
  const accuracy = useMemo(() => {
    let diagonal = 0;
    let total = 0;

    for (let i = 0; i < matrixData.length; i++) {
      for (let j = 0; j < matrixData[i].length; j++) {
        if (i === j) diagonal += matrixData[i][j];
        total += matrixData[i][j];
      }
    }

    return total > 0 ? ((diagonal / total) * 100).toFixed(1) : '0';
  }, [matrixData]);

  // 가장 혼동하는 클래스 쌍 찾기
  const mostConfusedPair = useMemo(() => {
    let maxConfusion = 0;
    let pair = { from: '', to: '', count: 0 };

    for (let i = 0; i < matrixData.length; i++) {
      for (let j = 0; j < matrixData[i].length; j++) {
        if (i !== j && matrixData[i][j] > maxConfusion) {
          maxConfusion = matrixData[i][j];
          pair = {
            from: labels[i],
            to: labels[j],
            count: matrixData[i][j],
          };
        }
      }
    }

    return pair;
  }, [matrixData, labels]);

  // 가장 잘 예측한 클래스 찾기
  const bestPredictedClass = useMemo(() => {
    let maxAccuracy = 0;
    let bestClass = '';

    for (let i = 0; i < matrixData.length; i++) {
      const rowSum = matrixData[i].reduce((sum, val) => sum + val, 0);
      const accuracy = rowSum > 0 ? matrixData[i][i] / rowSum : 0;

      if (accuracy > maxAccuracy) {
        maxAccuracy = accuracy;
        bestClass = labels[i];
      }
    }

    return { name: bestClass, accuracy: (maxAccuracy * 100).toFixed(2) };
  }, [matrixData, labels]);

  // 커스텀 툴팁 렌더러
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">
            실제: <span className="text-blue-600">{data.actualLabel}</span>
          </p>
          <p className="text-sm font-semibold text-gray-800">
            예측: <span className="text-violet-600">{data.predictedLabel}</span>
          </p>
          <p className="mt-1 font-medium text-gray-700">횟수: {data.z}</p>
          {data.isCorrect && <p className="mt-1 text-xs text-green-600">✓ 정확한 예측</p>}
        </div>
      );
    }
    return null;
  };
  const CustomShape = (props: any) => {
    const { cx, cy, payload } = props;
    const radius = Math.sqrt(props.zAxis.scale(payload.z) / Math.PI);

    return (
      <g>
        <circle cx={cx} cy={cy} r={radius} fill={payload.isCorrect ? '#4f46e5' : '#f87171'} fillOpacity={0.5 + (payload.z / chartData.maxCount) * 0.5} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={payload.isCorrect ? 'white' : '#ff5151'} fontSize={radius > 15 ? 12 : 10} fontWeight="bold">
          {payload.z}
        </text>
      </g>
    );
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">모델 평가</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 혼동 행렬 영역 */}
        <div className="flex flex-col">
          <h3 className="mb-3 text-lg font-medium text-gray-700">혼동 행렬 (Confusion Matrix)</h3>
          <p className="mb-2 text-sm text-gray-500">예측한 클래스와 실제 클래스 간의 관계를 보여주는 시각화입니다. 원의 크기는 해당 예측 횟수를 나타냅니다.</p>

          <div className="mt-2 h-80 w-full rounded-lg border border-gray-200 bg-gray-50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis
                  type="number"
                  dataKey="x"
                  name="예측"
                  domain={[-0.5, labels.length - 0.5]}
                  ticks={[...Array(labels.length).keys()]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => labels[value] || ''}
                  label={{ value: '예측 클래스', position: 'bottom', offset: 5, fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="실제"
                  domain={[-0.5, labels.length - 0.5]}
                  ticks={[...Array(labels.length).keys()]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => labels[labels.length - 1 - value] || ''}
                  label={{ value: '실제 클래스', angle: -90, position: 'left', offset: 10, fontSize: 12 }}
                />
                <ZAxis type="number" dataKey="z" range={[400, 2500]} domain={[0, chartData.maxCount]} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={chartData.data} shape={<CustomShape />}></Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <span className="text-sm font-medium text-gray-700">전체 정확도:</span>
            <span className="font-semibold text-blue-600">{accuracy}%</span>
          </div>
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h3 className="mb-3 text-lg font-medium text-gray-700">모델 인사이트</h3>

            <div className="space-y-4">
              <div className="rounded-md bg-white p-3 shadow-sm">
                <h4 className="text-sm font-semibold text-indigo-600">가장 잘 예측된 클래스</h4>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{bestPredictedClass.name}</span>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">{bestPredictedClass.accuracy}% 정확도</span>
                </div>
              </div>

              {mostConfusedPair.count > 0 && (
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <h4 className="text-sm font-semibold text-red-500">가장 많이 혼동하는 클래스</h4>
                  <div className="mt-2">
                    <p className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">{mostConfusedPair.from}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{mostConfusedPair.to}</span>
                      <span className="ml-auto rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">{mostConfusedPair.count}회</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-md bg-white p-3 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700">혼동 행렬 읽는 방법</h4>
                <ul className="mt-2 text-sm text-gray-600">
                  <li className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                    <span>파란색 원: 정확한 예측 (대각선)</span>
                  </li>
                  <li className="mt-1 flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-red-400"></span>
                    <span>빨간색 원: 잘못된 예측</span>
                  </li>
                  <li className="mt-1 flex items-center gap-1">
                    <span className="flex h-3 w-3 items-center justify-center rounded-full border border-dashed border-gray-400 text-xs">•</span>
                    <span>원 크기: 예측 횟수</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-lg border border-gray-100 bg-white p-4">
            <h3 className="mb-2 text-lg font-medium text-gray-700">해석 가이드</h3>
            <p className="text-sm text-gray-600">
              혼동 행렬은 분류 모델의 성능을 평가하는 중요한 도구입니다. 대각선의 원은 모델이 정확하게 예측한 경우를 나타내며, 크기가 클수록 더 많은 샘플을 정확히 예측했다는 의미입니다.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              비대각선의 원은 오분류 케이스를 나타냅니다. 예를 들어, 실제 클래스가 X인데 Y로 예측된 케이스의 수를 보여줍니다. 이러한 패턴을 분석하면 모델 개선 방향을 파악할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
