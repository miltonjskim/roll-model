// /entities/project-detail/ui/DataSplitCard.tsx
import { DataSplit } from "@/entities/project-detail/model/dataTypes";

interface DataSplitCardProps {
  dataSplit: DataSplit;
}

export const DataSplitCard = ({ dataSplit }: DataSplitCardProps) => {
  const { method, trainRatio, testRatio, validationRatio } = dataSplit;

  return (
    <div className="bg-[theme(color-card)] p-4 rounded-lg shadow-sm mb-4">
      <h2 className="text-lg font-semibold mb-3">데이터 분할 정보</h2>

      <div className="mb-2">
        <span className="text-sm text-[theme(color-muted-foreground)]">
          분할 방법:{" "}
        </span>
        <span className="font-medium">{getSplitMethodName(method)}</span>
      </div>

      <div className="w-full h-6 rounded-full overflow-hidden bg-[theme(color-muted)]">
        <div className="flex h-full">
          <div
            className="bg-[theme(color-blue-01)] h-full flex items-center justify-center"
            style={{ width: `${trainRatio * 100}%` }}
          >
            <span className="text-xs text-[theme(color-primary-white)] font-medium">
              훈련 {(trainRatio * 100).toFixed(0)}%
            </span>
          </div>

          {validationRatio > 0 && (
            <div
              className="bg-[theme(color-green-01)] h-full flex items-center justify-center"
              style={{ width: `${validationRatio * 100}%` }}
            >
              <span className="text-xs text-[theme(color-primary-white)] font-medium">
                검증 {(validationRatio * 100).toFixed(0)}%
              </span>
            </div>
          )}

          <div
            className="bg-[theme(color-rose-01)] h-full flex items-center justify-center"
            style={{ width: `${testRatio * 100}%` }}
          >
            <span className="text-xs text-[theme(color-primary-white)] font-medium">
              테스트 {(testRatio * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 분할 방법 이름 변환
const getSplitMethodName = (method: string): string => {
  const methodMap: Record<string, string> = {
    RANDOM: "랜덤 분할",
    STRATIFIED: "계층적 분할",
    TIME_SERIES: "시계열 분할",
  };

  return methodMap[method] || method;
};
