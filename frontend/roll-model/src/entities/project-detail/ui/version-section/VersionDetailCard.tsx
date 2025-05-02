// app/entities/project-detail/ui/version-section/VersionDetailCard.tsx
"use client";

import { formatDate } from "@/shared/lib/utils/dateUtils";
import { Pipelines } from "../../model/versionTypes";

interface VersionDetailCardProps {
  pipeline: Pipelines;
  className?: string;
}

export const VersionDetailCard: React.FC<VersionDetailCardProps> = ({
  pipeline,
  className = "",
}) => {
  if (!pipeline) return null;

  // 날짜 포맷팅 함수 (실제 구현은 utils 폴더에 있어야 함)
  const formatUpdatedDate = (dateString: string) => {
    try {
      return formatDate(dateString, "yyyy.MM.dd 수정");
    } catch (e) {
      return dateString;
    }
  };

  // 숫자 포맷팅 (천 단위 콤마)
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm ${className} border border-1`}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-gray-900">당뇨병 예측 모델</h2>
        <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-semibold">
          의학
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-start">
          <div className="text-blue-500 w-16 h-16 flex items-center justify-center bg-white rounded-full">
            <span className="text-xl font-semibold">v{pipeline.version}</span>
          </div>
          <div className="ml-4">
            <h3 className="text-sm text-gray-500">업데이트 일자</h3>
            <p className="font-medium">
              {formatUpdatedDate(pipeline.updatedAt)}
            </p>
            <div className="flex mt-1 items-center text-sm">
              <span className="mr-3">❤️ {pipeline.likeCount}</span>
              <span>⬇️ {pipeline.downloadCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">정확도(R² 계수)</h3>
            <p className="text-2xl font-bold">{pipeline.accuracy}%</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">데이터수</h3>
            <p className="text-2xl font-bold">
              {formatNumber(pipeline.dataCount)}개
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">목표변수</h3>
            <p className="font-medium">{pipeline.target}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">학습시간</h3>
            <p className="font-medium">{pipeline.runnungDuration}초</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button className="bg-[theme(primary-black)] hover:bg-gray-01 duration-300 ease-in text-white py-2 px-4 rounded-md transition-colors">
          상세
        </button>
        <button className="bg-[theme(primary-black)] hover:bg-gray-01 duration-300 ease-in text-white py-2 px-4 rounded-md transition-colors">
          모델 학습
        </button>
      </div>
    </div>
  );
};

export default VersionDetailCard;
