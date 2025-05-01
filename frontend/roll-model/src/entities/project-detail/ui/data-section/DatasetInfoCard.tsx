// /entities/project-detail/ui/DatasetInfoCard.tsx
import { Dataset } from "@/entities/project-detail/model/dataTypes";

interface DatasetInfoCardProps {
  dataset: Dataset;
}

export const DatasetInfoCard = ({ dataset }: DatasetInfoCardProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <h2 className="text-lg font-semibold mb-3">데이터 한눈에 보기</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-500">총 데이터 수</div>
          <div className="text-xl font-bold">
            {dataset.recordCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-500">컬럼 수</div>
          <div className="text-xl font-bold">{dataset.featureCount}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-500">목표변수</div>
          <div className="text-xl font-bold">{dataset.targetVariable}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-500">결측치 비율</div>
          <div className="text-xl font-bold">{dataset.missingRate}</div>
        </div>
      </div>
    </div>
  );
};
