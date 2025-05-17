// app/entities/project-detail/ui/version-section/VersionDetailCard.tsx
// 'use client';

import { Pipeline } from '@/entities/project-detail/model/versionTypes';
import { AfterSchoolDropdown } from '@/features/project-detail/AfterSchoolDropdown';
import { useAfterSchool } from '@/features/project-detail/useAfterSchool';
import { formatDate, getRelativeTime } from '@/shared/lib/utils/dateUtils';
import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { DOMAIN_STYLES } from '@/shared/ui/project-cards/DomainStyles';
import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';

interface VersionDetailCardProps {
  pipeline: Pipeline;
}

export const VersionDetailCard = ({ pipeline }: VersionDetailCardProps) => {
  // const projectDetail = useAtomValue(projectDetailAtom);
  const [projectDetail, setProjectDetail] = useAtom(projectDetailAtom);
  const router = useRouter();
  const { handleAfterSchoolClick } = useAfterSchool();
  if (!pipeline) return null;

  //상세보기
  const handleProjectClick = (e: any) => {
    e.stopPropagation();
    setProjectDetail({
      ...projectDetail,
      id: pipeline.pipelineId,
      version: pipeline.version,
    });
    router.push(`/project-detail/${pipeline.pipelineId}`);
  };

  // 도메인 정보를 표시하는 부분 수정:
  const domainIndex = pipeline.dataCount % 4;
  const domainStyle = DOMAIN_STYLES[projectDetail.domain] || DOMAIN_STYLES['GENERAL'];
  const domainIcon = domainStyle.icons[domainIndex];
  const domainColor = domainStyle.colors[domainIndex];
  const domainBorder = domainStyle.borders[domainIndex];

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
    <div className="border-[theme(primary-black)] mt-12 w-[24rem] cursor-pointer rounded-xl border border-2 bg-white shadow-sm transition-shadow hover:shadow-md" onClick={handleProjectClick}>
      {/* 헤더 */}
      <div className="bg-[theme(primary-black)] flex cursor-default items-center justify-between rounded-t-xl px-3 py-2 text-white select-none">
        {/* 헤더/왼쪽 */}
        <div className="flex items-center space-x-2">
          <h2 className="truncate text-lg font-semibold">{projectDetail.title}</h2>
          {projectDetail.category === 'CLASSIFICATION' ? (
            <div className="bg-[theme(color-green-02)] rounded-sm px-1 py-0.5 text-xs font-semibold whitespace-nowrap text-gray-600">분류</div>
          ) : (
            <div className="bg-[theme(color-yellow-02)] rounded-sm px-1 py-0.5 text-xs font-semibold whitespace-nowrap text-gray-600">회귀</div>
          )}
        </div>
      </div>
      {!pipeline.deletedYn && pipeline.publicYn ? (
        <center className="flex items-center justify-between p-4 select-none">
          {/* 센터 왼쪽 */}
          <section className="w-[7.5rem]">
            <div className="relative mt-3 mb-4 ml-2">
              <div className={`${domainColor} rounded-lg text-[4.5rem]`}>{domainIcon}</div>
              <div
                className={`${domainBorder} absolute -top-3 -right-4 flex h-10 w-10 items-center justify-center rounded-full border border-2 bg-white p-1 ${pipeline.version && pipeline.version.length >= 4 ? 'text-sm' : 'text-base'} font-bold`}
              >
                v{pipeline.version || '0.0'}
              </div>
              <div className={`${domainBorder} absolute -bottom-3 ${projectDetail.domain === 'GENERAL' ? '-left-2' : '-left-4'} rounded-lg border border-2 bg-white px-2 py-0.5 text-sm font-bold`}>
                {getDomainDisplayName(projectDetail.domain)}
              </div>
            </div>

            <div className="ml-2 flex flex-col">
              <div className="flex space-x-2">
                <div className="flex w-1/2 items-center">
                  <div className="font-tossface mr-1">❤️</div> {pipeline.likeCount >= 1000 ? `${(pipeline.likeCount / 1000).toFixed(1)}k` : pipeline.likeCount}
                </div>
                <div className="flex w-1/2 items-center">
                  <div className="font-tossface mr-1">⬇️</div> {pipeline.downloadCount >= 1000 ? `${(pipeline.downloadCount / 1000).toFixed(1)}k` : pipeline.downloadCount}
                </div>
              </div>
              <div className="w-full text-start text-xs text-gray-400">{getRelativeTime(pipeline.updatedAt)} 수정됨</div>
            </div>
          </section>

          {/* 센터 오른쪽 */}
          <section>
            {/* 그리드 */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
                <div className="w-full text-start text-xs">데이터 수</div>
                <div className={`text-md w-full overflow-hidden text-end font-semibold`}>{pipeline.dataCount.toLocaleString()}</div>
              </div>
              <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
                <div className="w-full text-start text-xs">목표변수</div>
                <div className={`text-md w-full overflow-hidden text-end font-semibold ${pipeline.target ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                  {pipeline.target || '학습대기중'}
                </div>
              </div>
              <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
                <div className="w-full text-start text-xs">학습시간</div>
                <div className={`text-md w-full overflow-hidden text-end font-semibold ${pipeline.runningDuration ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                  {pipeline.runningDuration || '학습대기중'}
                </div>
              </div>
              {projectDetail.category === 'CLASSIFICATION' ? (
                <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
                  <div className="w-full text-start text-xs">정확도</div>
                  <div className={`text-md w-full overflow-hidden text-end font-semibold ${pipeline.accuracy ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                    {pipeline.accuracy ? `${(pipeline.accuracy * 100).toFixed(2)}%` : '학습대기중'}
                  </div>
                </div>
              ) : (
                <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
                  <div className="w-full text-start text-xs">R²</div>
                  <div className={`text-md w-full overflow-hidden text-end font-semibold ${pipeline.rSquared ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                    {pipeline.rSquared ? (pipeline.rSquared * 100).toFixed(2) : '학습대기중'}
                  </div>
                </div>
              )}
            </div>
            {/* 하단 버튼 */}
            <div className="mt-4 flex justify-end gap-3 select-none">
              <button
                className="border-[theme(color-gray-01)] hover:border-[theme(primary-black)] text-[theme(color-gray-01)] text-md h-10 w-20 cursor-pointer rounded-md border border-2 duration-300 ease-out hover:font-semibold"
                onClick={handleProjectClick}
              >
                상세
              </button>

              <AfterSchoolDropdown project={tempProject} />
            </div>
          </section>
        </center>
      ) : (
        <div className='className="flex select-none" items-center justify-between p-4'>
          <div>삭제/비공개된 버전 입니다.</div>
        </div>
      )}
    </div>

    // {!pipeline.deletedYn && pipeline.publicYn ? (<></>) : (<></>)}
    // <div>
    //   <div className={`mt-12  w-90 rounded-lg border-1 bg-white p-6 shadow-sm`}>
    //     <div className="mb-4 flex items-start justify-between">
    //       <h2 className="text-xl font-bold text-gray-900">{projectDetail.title} (삭제/비공개 상태)</h2>
    //       <div className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{getDomainDisplayName(projectDetail.domain)}</div>
    //     </div>

    //     <div className="mb-6 grid grid-cols-1 gap-6">
    //       <div className="flex items-center justify-start rounded-lg bg-blue-50 p-4">
    //         <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-500">
    //           <p className="text-xl font-semibold">v{pipeline.version}</p>
    //         </div>
    //         <div className="ml-4">
    //           <h3 className="text-sm text-gray-500">업데이트 일자</h3>
    //           <p className="font-medium">{formatUpdatedDate(pipeline.updatedAt)}</p>
    //           <div className="mt-1 flex items-center text-sm">
    //             <p className="mr-3">❤️ {pipeline.likeCount}</p>
    //             <p>⬇️ {pipeline.downloadCount}</p>
    //           </div>
    //         </div>
    //       </div>

    //       {!pipeline.deletedYn && pipeline.publicYn ? (
    //         <div className="grid grid-cols-2 gap-4">
    //           <div className="rounded-lg bg-gray-50 p-3">
    //             <h3 className="mb-1 text-sm text-gray-500">정확도(R² 계수)</h3>
    //             {pipeline.accuracy && <p className="text-2xl font-bold">{(pipeline.accuracy * 100).toFixed(2)}%</p>}
    //             {pipeline.rSquared && <p className="text-2xl font-bold">{(pipeline.rSquared * 100).toFixed(2)}%</p>}
    //           </div>
    //           <div className="rounded-lg bg-gray-50 p-3">
    //             <h3 className="mb-1 text-sm text-gray-500">데이터수</h3>
    //             <p className="text-2xl font-bold">{formatNumber(pipeline.dataCount)}개</p>
    //           </div>
    //           <div className="rounded-lg bg-gray-50 p-3">
    //             <h3 className="mb-1 text-sm text-gray-500">목표변수</h3>
    //             <p className="font-medium">{pipeline.target}</p>
    //           </div>
    //           <div className="rounded-lg bg-gray-50 p-3">
    //             <h3 className="mb-1 text-sm text-gray-500">학습시간</h3>
    //             <p className="font-medium">{pipeline.runningDuration}초</p>
    //           </div>
    //         </div>
    //       ) : (
    //         <></>
    //       )}
    //     </div>
    //     {!pipeline.deletedYn && pipeline.publicYn ? (
    //       <div className="flex justify-end space-x-3">
    //         <button className="bg-[theme(primary-black)] hover:bg-gray-01 rounded-md px-4 py-2 text-white transition-colors duration-300 ease-in">상세</button>
    //         <AfterSchoolDropdown project={tempProject} />
    //       </div>
    //     ) : (
    //       <></>
    //     )}
    //   </div>
    // </div>
  );
};

export default VersionDetailCard;
