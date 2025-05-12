// /entities/project-detail/ui/DatasetInfoCard.tsx
import { Dataset } from '@/entities/project-detail/model/dataTypes';

interface DatasetInfoCardProps {
  dataset: Dataset;
}

export const DatasetInfoCard = ({ dataset }: DatasetInfoCardProps) => {
  return (
    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">데이터 한눈에 보기</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded bg-gray-50 p-3">
          <div className="text-sm text-gray-500">총 데이터 수</div>
          <div className="text-xl font-bold">{dataset.recordCount ? dataset.recordCount.toLocaleString() : '-'}</div>
        </div>
        <div className="rounded bg-gray-50 p-3">
          <div className="text-sm text-gray-500">컬럼 수</div>
          <div className="text-xl font-bold">{dataset.featureCount ? dataset.featureCount : '-'}</div>
        </div>
        <div className="rounded bg-gray-50 p-3">
          <div className="text-sm text-gray-500">목표변수</div>
          <div className="text-xl font-bold">{dataset.targetVariable ? dataset.targetVariable : '-'}</div>
        </div>
        <div className="rounded bg-gray-50 p-3">
          <div className="text-sm text-gray-500">결측치 비율</div>
          <div className="text-xl font-bold">{dataset.missingRate ? dataset.missingRate : '-'}</div>
        </div>
      </div>
    </div>
  );
};
