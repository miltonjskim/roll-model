// /entities/project-detail/ui/DatasetInfoCard.tsx
import { Dataset } from '@/entities/project-detail/model/dataTypes';
import { CssDetailHovering } from '@/widgets/project/project-detail/ProjectDetailCard';

interface DatasetInfoCardProps {
  dataset: Dataset;
}

export const DatasetInfoCard = ({ dataset }: DatasetInfoCardProps) => {
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(2).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(2).replace(/\.0$/, '') + 'k';
    }
    return num.toLocaleString();
  };
  const tempRecordCount = formatNumber(dataset.recordCount);
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className={`bg-[theme(color-blue-03)] hover:bg-[theme(color-blue-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
        <div className="flex flex-col">
          <div className="h-[2rem] text-start text-sm text-gray-500">총 데이터 수</div>
          <div className="text-start text-xl font-bold lg:text-3xl">{dataset.recordCount ? tempRecordCount : '-'}</div>
        </div>
        {/* 🗂️📁💼📦 */}
        <div className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">🗃️</div>
      </div>
      <div className={`bg-[theme(color-yellow-03)] hover:bg-[theme(color-yellow-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
        <div className="flex flex-col">
          <div className="h-[2rem] text-start text-sm text-gray-500">컬럼 수</div>
          <div className="text-start text-xl font-bold lg:text-3xl">{dataset.featureCount ? dataset.featureCount : '-'}</div>
        </div>
        {/* 📋🧾 */}
        <div className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">🏛️</div>
      </div>
      <div className={`bg-[theme(color-green-03)] hover:bg-[theme(color-green-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
        <div className="flex flex-col">
          <div className="h-[2rem] text-start text-sm text-gray-500">목표변수</div>
          <div className="text-start text-xl font-bold lg:text-3xl">{dataset.targetVariable ? dataset.targetVariable : '-'}</div>
        </div>
        {/* 🧭📌📍🎯 */}
        <div className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">🚩</div>
      </div>
      <div className={`bg-[theme(color-pink-03)] hover:bg-[theme(color-pink-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
        <div className="flex flex-col">
          <div className="h-[2rem] text-start text-sm text-gray-500">결측치 비율</div>
          <div className="text-start text-xl font-bold lg:text-3xl">{dataset.missingRate ? dataset.missingRate : '-'}</div>
        </div>
        {/* 🔧 */}
        <div className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">🕳️</div>
      </div>
    </div>
  );
};
