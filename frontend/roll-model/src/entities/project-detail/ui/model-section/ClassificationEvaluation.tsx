'use client';

import { ConfusionMatrix } from '@/entities/project-detail/model/ModelTypes';
import { CssDetailHovering } from '@/widgets/project/project-detail/ProjectDetailCard';
import { memo, useMemo, useState } from 'react';
import { ResponsiveContainer, Tooltip, Cell, ScatterChart, Scatter, XAxis, YAxis, ZAxis } from 'recharts';
import { MdOutlineCancel } from 'react-icons/md';

interface ClassificationEvaluationProps {
  confusionMatrix: ConfusionMatrix;
}

export default function ClassificationEvaluation({ confusionMatrix }: ClassificationEvaluationProps) {
  const { labels, matrixData } = confusionMatrix;
  const [isOn, setIsOn] = useState(false);

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
          <p className="text-sm font-semibold">
            실제: <span className="text-[theme(color-blue-01)]">{data.actualLabel}</span>
          </p>
          <p className="text-sm font-semibold">
            예측: <span className="text-[theme(color-purple-01)]">{data.predictedLabel}</span>
          </p>
          <p className="text-[theme(primary-black)] mt-1 font-medium">횟수: {data.z}</p>
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
    <section className="mb-4 rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-start text-lg font-semibold">모델 평가</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 왼쪽 영역 */}
        <div className="flex flex-col">
          {/* 왼 상단 */}
          <h3 className="text-[theme(primary-black)] mb-3 text-start text-lg font-medium">혼동 행렬 (Confusion Matrix)</h3>
          <p className="text-[theme(color-muted-foreground)] text-start text-sm">혼동 행렬은 모델이 얼마나 정확히 맞혔는지 보여주는 그림입니다.</p>
          <p className="text-[theme(color-muted-foreground)] mb-2 text-start text-sm">마치 학생의 시험 답안지를 채점한 결과표와 비슷해요</p>

          {/* 찐 혼동행렬 */}
          <div className="bg-[theme(color-card-background)] mt-2 h-80 w-full rounded-lg border border-gray-200 p-2">
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
                  label={{ value: '예측 그룹', position: 'bottom', offset: 5, fontSize: 16, fill: '#181d2b', fontWeight: 'bold' }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="실제"
                  domain={[-0.5, labels.length - 0.5]}
                  ticks={[...Array(labels.length).keys()]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => labels[labels.length - 1 - value] || ''}
                  label={{ value: '실제 그룹', angle: -90, position: 'left', offset: 10, fontSize: 16, fill: '#181d2b', fontWeight: 'bold' }}
                />
                <ZAxis type="number" dataKey="z" range={[400, 2500]} domain={[0, chartData.maxCount]} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={chartData.data} shape={<CustomShape />}></Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* 온오프(왼아래) */}
          {isOn && (
            <div>
              {/* 왼 아래 1 */}
              <div className="mt-8 flex justify-between gap-6">
                {/* 읽는법 */}
                <div className="bg-[theme(color-card-background)] w-[12rem] flex-shrink-0 rounded-md p-3 shadow-sm">
                  <h4 className="text-[theme(primary-black)] text-start text-sm font-semibold">혼동 행렬 읽는 방법</h4>
                  <ul className="text-[theme(color-muted-foreground)] mt-2 text-sm">
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
                {/* 정확도 */}
                <div className="bg-[theme(color-card-background)] flex-1 rounded-md p-4 shadow-sm">
                  <div className={`w-full rounded-md bg-white p-3 shadow-sm ${CssDetailHovering} flex h-full flex-col justify-between`}>
                    <span className="text-[theme(primary-black)] text-start text-lg font-medium">전체 정확도</span>
                    <span className="text-[theme(color-blue-01)] text-end text-4xl font-semibold">{accuracy}%</span>
                  </div>
                </div>
              </div>
              {/* 왼 아래 2 */}
              <div className="bg-[theme(color-card-background)] mt-8 flex justify-between gap-4 rounded-lg p-4 shadow-sm">
                {/* 굿 */}
                <div className={`w-full rounded-md bg-white p-3 shadow-sm ${CssDetailHovering}`}>
                  <h4 className="text-[theme(color-blue-01)] text-lg font-semibold">가장 잘 예측된 그룹</h4>
                  <div className="mt-2 flex flex-col">
                    <div className="text-[theme(color-muted-foreground)] text-start text-lg font-medium">{bestPredictedClass.name}</div>
                    <div className="text-[theme(primary-black)] text-end text-xl font-semibold">{bestPredictedClass.accuracy}% 정확도</div>
                  </div>
                </div>
                {/* 배드 */}
                {mostConfusedPair.count > 0 && (
                  <div className={`w-full rounded-md bg-white p-3 shadow-sm ${CssDetailHovering}`}>
                    <h4 className="text-[theme(color-pink-01)] text-lg font-semibold">가장 많이 혼동하는 그룹</h4>
                    <div className="mt-2 flex flex-col">
                      <div className="text-[theme(color-muted-foreground)] flex flex-col items-center text-start text-lg xl:flex-row">
                        <span className="mr-2 font-medium">{mostConfusedPair.from}</span>
                        <span className="font-medium"> → {mostConfusedPair.to}</span>
                      </div>
                      <div className="text-[theme(primary-black)] text-end text-xl font-semibold">{mostConfusedPair.count}회</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex flex-col gap-4">
          {/* 온오프(오른위) */}
          {!isOn && (
            <div>
              {/* 오른 위 1 */}
              <div className="mt-8 flex justify-between gap-6">
                {/* 읽는법 */}
                <div className="bg-[theme(color-card-background)] w-[12rem] flex-shrink-0 rounded-md p-3 shadow-sm">
                  <h4 className="text-[theme(primary-black)] text-start text-sm font-semibold">혼동 행렬 읽는 방법</h4>
                  <ul className="text-[theme(color-muted-foreground)] mt-2 text-sm">
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
                {/* 정확도 */}
                <div className="bg-[theme(color-card-background)] flex-1 rounded-md p-4 shadow-sm">
                  <div className={`w-full rounded-md bg-white p-3 shadow-sm ${CssDetailHovering} flex h-full flex-col justify-between`}>
                    <span className="text-[theme(primary-black)] text-start text-lg font-medium">전체 정확도</span>
                    <span className="text-[theme(color-blue-01)] text-end text-4xl font-semibold">{accuracy}%</span>
                  </div>
                </div>
              </div>
              {/* 오른 위 2 */}
              <div className="bg-[theme(color-card-background)] mt-4 flex justify-between gap-4 rounded-lg p-4 shadow-sm">
                {/* 굿 */}
                <div className={`w-full rounded-md bg-white p-3 shadow-sm ${CssDetailHovering}`}>
                  <h4 className="text-[theme(color-blue-01)] text-lg font-semibold">가장 잘 예측된 그룹</h4>
                  <div className="mt-2 flex flex-col">
                    <div className="text-[theme(color-muted-foreground)] text-start text-lg font-medium">{bestPredictedClass.name}</div>
                    <div className="text-[theme(primary-black)] text-end text-xl font-semibold">{bestPredictedClass.accuracy}% 정확도</div>
                  </div>
                </div>
                {/* 배드 */}
                {mostConfusedPair.count > 0 && (
                  <div className={`w-full rounded-md bg-white p-3 shadow-sm ${CssDetailHovering}`}>
                    <h4 className="text-[theme(color-pink-01)] text-lg font-semibold">가장 많이 혼동하는 그룹</h4>
                    <div className="mt-2 flex flex-col">
                      <div className="text-[theme(color-muted-foreground)] flex flex-col items-center text-start text-lg xl:flex-row">
                        <span className="mr-2 font-medium">{mostConfusedPair.from}</span>
                        <span className="font-medium"> → {mostConfusedPair.to}</span>
                      </div>
                      <div className="text-[theme(primary-black)] text-end text-xl font-semibold">{mostConfusedPair.count}회</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {!isOn && (
            <button
              className="border-[theme(primary-black)] text-[theme(primary-black)] text-md hover:text-[theme(primary-white)] hover:bg-[theme(primary-black)] mt-2 h-[3rem] w-full cursor-pointer rounded-md border border-2 font-semibold transition-all duration-300 ease-in-out select-none"
              onClick={() => setIsOn(!isOn)}
            >
              혼동 행렬 활용 가이드 자세히 보기
            </button>
          )}

          {/* 해석가이드  */}
          {isOn && (
            <div className="relative flex-1 rounded-lg border border-gray-100 bg-white p-4">
              <button className="text-[theme(color-gray-03)] hover:text-[theme(color-gray-02)] absolute top-4 right-4 text-xl transition-all duration-300" onClick={() => setIsOn(!isOn)}>
                <MdOutlineCancel />
              </button>
              <h3 className="text-[theme(primary-black)] flex-1 text-center text-lg font-medium">혼동 행렬 활용 가이드</h3>
              <h4 className="text-[theme(color-blue-01)] mb-2 text-end text-base font-medium">정확도 향상을 위한 5가지 방법</h4>
              <p className="text-[theme(color-muted-foreground)] mb-3 text-start text-sm font-medium">
                혼동 행렬을 통해 모델이 헷갈리는 부분을 찾아내고, <span className="text-[theme(color-rose-01)]">빨간 원(오류)</span>을{' '}
                <span className="text-[theme(color-blue-01)]">파란 원(정확)</span>
                으로 바꾸는 것이 목표입니다!
              </p>
              <div className="space-y-3">
                <div className={`bg-[theme(color-card-background)] relative rounded-md p-3 pl-10 ${CssDetailHovering} hover:bg-[theme(color-gray-04)]`}>
                  <div className="bg-[theme(primary-black)] absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full font-semibold text-white">1</div>
                  <div className="text-center">
                    <h5 className="text-[theme(primary-black)] font-medium">헷갈리는 그룹 학습 강화하기</h5>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm">
                      <span className="text-[theme(color-rose-01)]">빨간 원</span>이 큰 부분(자주 헷갈리는 그룹)의 데이터를 더 많이 학습시켜요
                    </p>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm italic">
                      예: &apos;일반 고객&apos;과 &apos;우수 고객&apos;을 자주 헷갈린다면, 이 두 그룹의 차이점을 보여주는 데이터를 더 추가하세요
                    </p>
                  </div>
                </div>

                <div className={`bg-[theme(color-card-background)] relative rounded-md p-3 pl-10 ${CssDetailHovering} hover:bg-[theme(color-gray-04)]`}>
                  <div className="bg-[theme(primary-black)] absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full font-semibold text-white">2</div>
                  <div className="text-center">
                    <h5 className="text-[theme(primary-black)] font-medium">구분에 도움되는 정보 추가하기</h5>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm">
                      <span className="text-[theme(color-rose-01)]">빨간 원</span>을 <span className="text-[theme(color-blue-01)]">파란 원</span>으로 바꾸기 위해 구분에 도움되는 새로운 정보를 추가해요
                    </p>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm italic">
                      예: 구매 데이터에 &apos;총액&apos;만 있다면, &apos;구매 빈도&apos;나 &apos;평균 구매액&apos; 같은 새로운 정보를 추가해보세요
                    </p>
                  </div>
                </div>

                <div className={`bg-[theme(color-card-background)] relative rounded-md p-3 pl-10 ${CssDetailHovering} hover:bg-[theme(color-gray-04)]`}>
                  <div className="bg-[theme(primary-black)] absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full font-semibold text-white">3</div>
                  <div className="text-center">
                    <h5 className="text-[theme(primary-black)] font-medium">데이터 균형 맞추기</h5>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm">
                      <span className="text-[theme(color-rose-01)]">빨간 원</span>이 많은 그룹의 데이터가 너무 적다면, 그 데이터의 중요도를 높여주세요
                    </p>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm italic">
                      예: &apos;정상&apos; 데이터가 1000개인데 &apos;이상 징후&apos; 데이터가 10개뿐이라면, &apos;이상 징후&apos; 데이터의 가중치를 높이거나 더 수집하세요
                    </p>
                  </div>
                </div>

                <div className={`bg-[theme(color-card-background)] relative rounded-md p-3 pl-10 ${CssDetailHovering} hover:bg-[theme(color-gray-04)]`}>
                  <div className="bg-[theme(primary-black)] absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full font-semibold text-white">4</div>
                  <div className="text-center">
                    <h5 className="text-[theme(primary-black)] font-medium">더 발전된 모델 사용하기</h5>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm">
                      많은 <span className="text-[theme(color-rose-01)]">빨간 원</span>이 있다면, 더 복잡한 패턴을 찾을 수 있는 발전된 모델을 시도해보세요
                    </p>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm italic">
                      예: 간단한 모델로는 구분이 어렵다면, 여러 모델을 합친 &apos;앙상블&apos; 방식을 사용해 정확도를 높여보세요
                    </p>
                  </div>
                </div>

                <div className={`bg-[theme(color-card-background)] relative rounded-md p-3 pl-10 ${CssDetailHovering} hover:bg-[theme(color-gray-04)]`}>
                  <div className="bg-[theme(primary-black)] absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full font-semibold text-white">5</div>
                  <div className="text-center">
                    <h5 className="text-[theme(primary-black)] font-medium">학습 설정 조정하기</h5>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm">
                      <span className="text-[theme(color-rose-01)]">빨간 원</span>을 <span className="text-[theme(color-blue-01)]">파란 원</span>으로 바꾸기 위해 학습 방식을 미세 조정해요
                    </p>
                    <p className="text-[theme(color-muted-foreground)] mt-1 text-sm italic">예: 학습 속도를 조절하거나, 학습 반복 횟수를 늘리거나, 모델이 한 번에 보는 데이터 양을 조절해보세요</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
