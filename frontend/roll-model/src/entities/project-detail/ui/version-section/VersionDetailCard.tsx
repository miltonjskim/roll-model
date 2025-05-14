// app/entities/project-detail/ui/version-section/VersionDetailCard.tsx
'use client';

import { Pipeline } from '@/entities/project-detail/model/versionTypes';
import { AfterSchoolDropdown } from '@/features/project-detail/AfterSchoolDropdown';
import { formatDate } from '@/shared/lib/utils/dateUtils';
import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useAtomValue } from 'jotai';

interface VersionDetailCardProps {
  pipeline: Pipeline;
  className?: string;
}

export const VersionDetailCard = ({ pipeline, className = '' }: VersionDetailCardProps) => {
  const projectDetail = useAtomValue(projectDetailAtom);
  if (!pipeline) return null;

  // 날짜 포맷팅 함수 (실제 구현은 utils 폴더에 있어야 함)
  const formatUpdatedDate = (dateString: string) => {
    try {
      return formatDate(dateString, 'yyyy.MM.dd 수정');
    } catch (e) {
      return dateString;
    }
  };

  // 숫자 포맷팅 (천 단위 콤마)
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  const tempProject = {
    id: pipeline.pipelineId,
    title: projectDetail.title,
    status: 'COMPLETED',
  };

  return (
    <div className={`rounded-lg bg-white p-6 shadow-sm ${className} mt-12 w-90 border-1`}>
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-xl font-bold text-gray-900">{projectDetail.title} (삭제/비공개 상태)</h2>
        <div className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{getDomainDisplayName(projectDetail.domain)}</div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6">
        <div className="flex items-center justify-start rounded-lg bg-blue-50 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-500">
            <p className="text-xl font-semibold">v{pipeline.version}</p>
          </div>
          <div className="ml-4">
            {/* {!pipeline.deletedYn && pipeline.publicYn ? projectDetail.title : ''} */}
            <h3 className="text-sm text-gray-500">업데이트 일자</h3>
            <p className="font-medium">{formatUpdatedDate(pipeline.updatedAt)}</p>
            <div className="mt-1 flex items-center text-sm">
              <p className="mr-3">❤️ {pipeline.likeCount}</p>
              <p>⬇️ {pipeline.downloadCount}</p>
            </div>
          </div>
        </div>
        {!pipeline.deletedYn && pipeline.publicYn ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <h3 className="mb-1 text-sm text-gray-500">정확도(R² 계수)</h3>
              {pipeline.accuracy && <p className="text-2xl font-bold">{(pipeline.accuracy * 100).toFixed(2)}%</p>}
              {pipeline.rSquared && <p className="text-2xl font-bold">{(pipeline.rSquared * 100).toFixed(2)}%</p>}
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <h3 className="mb-1 text-sm text-gray-500">데이터수</h3>
              <p className="text-2xl font-bold">{formatNumber(pipeline.dataCount)}개</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <h3 className="mb-1 text-sm text-gray-500">목표변수</h3>
              <p className="font-medium">{pipeline.target}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <h3 className="mb-1 text-sm text-gray-500">학습시간</h3>
              <p className="font-medium">{pipeline.runnungDuration}초</p>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
      {!pipeline.deletedYn && pipeline.publicYn ? (
        <div className="flex justify-end space-x-3">
          <button className="bg-[theme(primary-black)] hover:bg-gray-01 rounded-md px-4 py-2 text-white transition-colors duration-300 ease-in">상세</button>
          {/* <button className="bg-[theme(primary-black)] hover:bg-gray-01 rounded-md px-4 py-2 text-white transition-colors duration-300 ease-in">모델 학습</button> */}
          <AfterSchoolDropdown project={tempProject} />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default VersionDetailCard;
