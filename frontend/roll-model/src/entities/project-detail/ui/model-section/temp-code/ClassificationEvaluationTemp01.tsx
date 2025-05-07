'use client';

import { ConfusionMatrix } from '@/entities/project-detail/model/ModelTypes';
import { memo, useMemo } from 'react';

interface ClassificationEvaluationProps {
  confusionMatrix: ConfusionMatrix;
}

// 색상 그라데이션 계산 함수
function getColorIntensity(value: number, maxValue: number): string {
  // 값에 따라 그라데이션 강도를 계산 (0.2-0.9 범위)
  const intensity = 0.2 + (value / maxValue) * 0.7;
  // rgb 색상 반환 (파란색 그라데이션)
  return `rgba(79, 70, 229, ${intensity})`;
}

const ClassificationEvaluation = memo(({ confusionMatrix }: ClassificationEvaluationProps) => {
  const { labels, matrixData } = confusionMatrix;

  // 최대값 계산 (색상 강도 설정에 사용)
  const maxValue = useMemo(() => {
    let max = 0;
    for (const row of matrixData) {
      for (const value of row) {
        if (value > max) max = value;
      }
    }
    return max;
  }, [matrixData]);

  // 정확도 계산 (대각선 합 / 전체 합)
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

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">모델 평가</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 혼동 행렬 영역 */}
        <div className="flex flex-col">
          <h3 className="mb-3 text-lg font-medium text-gray-700">혼동 행렬 (Confusion Matrix)</h3>
          <p className="mb-4 text-sm text-gray-500">예측한 클래스와 실제 클래스 간의 관계를 보여주는 표입니다. 대각선 값이 높을수록 모델 성능이 우수합니다.</p>

          <div className="mt-2 flex flex-col rounded-lg border border-gray-200">
            {/* 라벨 행 (상단) */}
            <div className="flex">
              <div className="w-24 flex-shrink-0 p-2"></div>
              <div className="flex flex-grow">
                {labels.map((label, idx) => (
                  <div key={`col-${idx}`} className="flex-1 p-2 text-center font-medium text-gray-700">
                    {label} <span className="block text-xs text-gray-500">예측</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 행별 데이터 */}
            {matrixData.map((row, rowIdx) => (
              <div key={`row-${rowIdx}`} className="flex border-t border-gray-200">
                <div className="flex w-24 flex-shrink-0 items-center justify-center p-2 font-medium text-gray-700">
                  {labels[rowIdx]}
                  <span className="ml-1 text-xs text-gray-500">실제</span>
                </div>
                <div className="flex flex-grow">
                  {row.map((value, colIdx) => (
                    <div
                      key={`cell-${rowIdx}-${colIdx}`}
                      className="flex flex-1 items-center justify-center p-3 text-center"
                      style={{
                        backgroundColor: rowIdx === colIdx ? getColorIntensity(value, maxValue) : value > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <span className={`font-medium ${rowIdx === colIdx ? 'text-white' : 'text-gray-700'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <span className="text-sm font-medium text-gray-700">전체 정확도:</span>
            <span className="font-semibold text-blue-600">{accuracy}%</span>
          </div>
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h3 className="mb-3 text-lg font-medium text-gray-700">해석 가이드</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">혼동 행렬이란?</h4>
              <p className="text-sm text-gray-600">모델이 예측한 클래스와 실제 클래스 간의 관계를 나타내는 표입니다. 각 셀의 값은 해당 조합으로 예측된 샘플의 수를 표시합니다.</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700">어떻게 읽나요?</h4>
              <ul className="ml-4 list-disc text-sm text-gray-600">
                <li className="mt-1">
                  <span className="font-medium">대각선 값</span>: 모델이 정확하게 예측한 샘플 수
                </li>
                <li className="mt-1">
                  <span className="font-medium">비대각선 값</span>: 모델이 잘못 예측한 샘플 수
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700">좋은 모델의 특징</h4>
              <p className="text-sm text-gray-600">대각선 값이 높고 비대각선 값이 낮을수록 좋은 모델입니다. 이는 모델이 대부분의 클래스를 정확하게 예측했음을 의미합니다.</p>
            </div>

            <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
              <h4 className="text-sm font-semibold text-indigo-600">분석 인사이트</h4>
              <p className="text-sm text-gray-600">
                이 모델은 {labels[matrixData.findIndex((row, idx) => row[idx] === Math.max(...matrixData.map((r, i) => r[i])))]} 클래스에서 가장 높은 정확도를 보입니다.
                {(() => {
                  // 가장 많이 혼동하는 클래스 쌍 찾기
                  let maxConfusion = 0;
                  let confusedPair = [0, 0];

                  for (let i = 0; i < matrixData.length; i++) {
                    for (let j = 0; j < matrixData[i].length; j++) {
                      if (i !== j && matrixData[i][j] > maxConfusion) {
                        maxConfusion = matrixData[i][j];
                        confusedPair = [i, j];
                      }
                    }
                  }

                  return maxConfusion > 0 ? ` 하지만 ${labels[confusedPair[0]]} 클래스를 가장 많이 혼동합니다.` : '';
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

ClassificationEvaluation.displayName = 'ClassificationEvaluation';

// export default ClassificationEvaluation;
