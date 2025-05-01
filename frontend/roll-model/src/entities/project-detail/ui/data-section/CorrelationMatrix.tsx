// /entities/project-detail/ui/CorrelationMatrix.tsx
import { CorrelationMatrix as CorrelationMatrixType } from "@/entities/project-detail/model/dataTypes";
import { useState } from "react";

interface CorrelationMatrixProps {
  correlationMatrix: CorrelationMatrixType;
}

export const CorrelationMatrix = ({
  correlationMatrix,
}: CorrelationMatrixProps) => {
  const { featureNames, matrix } = correlationMatrix;

  return (
    <div className="bg-[theme(color-card)] p-4 rounded-lg shadow-sm mb-4">
      <h2 className="text-lg font-semibold mb-3">변수 간 상관관계</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 bg-[theme(color-muted)]"></th>
              {featureNames.map((name, i) => (
                <th
                  key={i}
                  className="px-4 py-2 bg-[theme(color-muted)] font-medium"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="px-4 py-2 bg-[theme(color-muted)] font-medium">
                  {featureNames[rowIdx]}
                </td>
                {row.map((value, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-4 py-2 text-center"
                    style={{
                      backgroundColor: getCorrelationColor(value),
                      color:
                        Math.abs(value) > 0.5
                          ? "var(--primary-white)"
                          : "var(--primary-black)",
                    }}
                  >
                    {value.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 상관계수에 따른 색상 지정
const getCorrelationColor = (value: number): string => {
  // 절대값 기준으로 색상 강도 결정
  const absValue = Math.abs(value);

  if (value === 1) return "var(--color-blue-01)"; // 자기 자신과의 상관관계는 진한 파란색
  if (value > 0) {
    // 양의 상관관계: 보라색 계열
    if (absValue > 0.7) return "var(--color-purple-01)";
    if (absValue > 0.5) return "var(--color-purple-02)";
    if (absValue > 0.3) return "var(--color-purple-02)";
    if (absValue > 0.1) return "var(--color-purple-03)";
    return "var(--color-gray-05)";
  } else {
    // 음의 상관관계: 빨간색 계열
    if (absValue > 0.7) return "var(--color-rose-01)";
    if (absValue > 0.5) return "var(--color-rose-01)";
    if (absValue > 0.3) return "var(--color-rose-02)";
    if (absValue > 0.1) return "var(--color-rose-03)";
    return "var(--color-gray-05)";
  }
};
