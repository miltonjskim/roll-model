import { Project } from '@/entities/dashboard/model/types';
import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { formatDate, getRelativeTime } from '@/shared/lib/utils/dateUtils';
import { useAfterSchool } from '@/features/project-detail/useAfterSchool';
import { AfterSchoolDropdown } from '@/features/project-detail/AfterSchoolDropdown';
// status icons
import { ImSpinner } from 'react-icons/im';
import { TiLockClosed } from 'react-icons/ti';
import { TiLockOpen } from 'react-icons/ti';
import { IoWarning } from 'react-icons/io5';
import { SiGoogledocs } from 'react-icons/si';
import { DOMAIN_STYLES } from '@/shared/ui/project-cards/DomainStyles';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const setProjectDetail = useSetAtom(projectDetailAtom);
  const router = useRouter();
  const { handleAfterSchoolClick } = useAfterSchool();

  //상세보기
  const handleProjectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setProjectDetail({
      id: project.id,
      title: project.title,
      version: project.version,
      category: project.category,
      domain: project.domain,
      ownerYn: false,
    });
    router.push(`/project-detail/${project.id}`);
  };

  // 도메인 정보를 표시하는 부분 수정:
  const domainIndex = project.dataCount % 4;
  const domainStyle = DOMAIN_STYLES[project.domain] || DOMAIN_STYLES['GENERAL'];
  const domainIcon = domainStyle.icons[domainIndex];
  const domainColor = domainStyle.colors[domainIndex];
  const domainBorder = domainStyle.borders[domainIndex];

  // 카드 전체클릭 (상세이동 or 설명 나오도록)
  const handleIsThisGotThatDetail = (status: string) => {
    if (status === 'COMPLETED') {
      setProjectDetail({
        id: project.id,
        title: project.title,
        version: project.version,
        category: project.category,
        domain: project.domain,
        ownerYn: false,
      });
      router.push(`/project-detail/${project.id}`);
      return;
    } else {
      // 여기에 검정배경 설명코드 작성
    }
  };

  return (
    <div className="cursor-pointer rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md" onClick={() => handleIsThisGotThatDetail(project.status)}>
      {/* 헤더 */}
      <div className="bg-[theme(primary-black)] flex cursor-default items-center justify-between rounded-t-xl px-3 py-2 text-white select-none">
        {/* 헤더/왼쪽 */}
        <div className="flex items-center space-x-2">
          <h2 className="truncate text-lg font-semibold">{project.title}</h2>
          {project.category === 'CLASSIFICATION' ? (
            <div className="bg-[theme(color-green-02)] rounded-sm px-1 py-0.5 text-xs font-semibold whitespace-nowrap text-gray-600">분류</div>
          ) : (
            <div className="bg-[theme(color-yellow-02)] rounded-sm px-1 py-0.5 text-xs font-semibold whitespace-nowrap text-gray-600">회귀</div>
          )}
        </div>
        {/* 헤더/오른쪽 */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              project.status === 'COMPLETED'
                ? project.publicYn
                  ? 'border-[var(--color-green-01)]' // 완료&공개
                  : 'border-[var(--color-gray-01)]' // 완료&비공개
                : project.status === 'PREPROCESSED'
                  ? 'border-[var(--color-yellow-01)]' // 준비됨
                  : project.status === 'LEARNING'
                    ? 'border-[var(--color-purple-01)]' // 학습중
                    : 'border-[var(--color-rose-01)]' // 실패
            }`}
          >
            <div
              className={` ${
                project.status === 'COMPLETED'
                  ? project.publicYn
                    ? 'text-lg text-[var(--color-green-01)]' // 완료&공개
                    : 'text-lg text-[var(--color-gray-01)]' // 완료&비공개
                  : project.status === 'PREPROCESSED'
                    ? 'text-md text-[var(--color-yellow-01)]' // 준비됨
                    : project.status === 'LEARNING'
                      ? 'text-md text-[var(--color-purple-01)]' // 학습중
                      : 'text-lg text-[var(--color-rose-01)]' // 실패
              }`}
            >
              {project.status === 'COMPLETED' ? (
                project.publicYn ? (
                  <TiLockOpen />
                ) : (
                  <TiLockClosed />
                )
              ) : project.status === 'PREPROCESSED' ? (
                <SiGoogledocs />
              ) : project.status === 'LEARNING' ? (
                <ImSpinner />
              ) : (
                <IoWarning />
              )}
            </div>
          </div>
          <div className={`rounded bg-[var(--primary-white)]/10 px-2 py-1 text-xs`}>
            {project.status === 'COMPLETED' ? (project.publicYn ? '공개' : '비공개') : project.status === 'PREPROCESSED' ? '준비됨' : project.status === 'LEARNING' ? '학습중' : '실패'}
          </div>
        </div>
      </div>

      <center className="flex items-center justify-between p-4 select-none">
        {/* 센터 왼쪽 */}
        <section className="w-[7.5rem]">
          <div className="relative mt-3 mb-4 ml-2">
            <div className={`${domainColor} rounded-lg text-[4.5rem]`}>{domainIcon}</div>
            <div
              className={`${domainBorder} absolute -top-3 -right-4 flex h-10 w-10 items-center justify-center rounded-full border border-2 bg-white p-1 ${project.version && project.version.length >= 4 ? 'text-sm' : 'text-base'} font-bold`}
            >
              v{project.version || '0.0'}
            </div>
            <div className={`${domainBorder} absolute -bottom-3 ${project.domain === 'GENERAL' ? '-left-2' : '-left-4'} rounded-lg border border-2 bg-white px-2 py-0.5 text-sm font-bold`}>
              {project.displayDomain || getDomainDisplayName(project.domain)}
            </div>
          </div>

          <div className="ml-2 flex flex-col">
            <div className="flex space-x-2">
              <div className="flex w-1/2 items-center">
                <div className="font-tossface mr-1">❤️</div> {project.likeCount >= 1000 ? `${(project.likeCount / 1000).toFixed(1)}k` : project.likeCount}
              </div>
              <div className="flex w-1/2 items-center">
                <div className="font-tossface mr-1">⬇️</div> {project.downloadCount >= 1000 ? `${(project.downloadCount / 1000).toFixed(1)}k` : project.downloadCount}
              </div>
            </div>
            <div className="w-full text-end text-xs text-gray-400">{getRelativeTime(project.updatedAt)} 수정됨</div>
          </div>
        </section>

        {/* 센터 오른쪽 */}
        <section>
          {/* 그리드 */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
              <div className="w-full text-start text-xs">데이터 수</div>
              <div className={`text-md w-full overflow-hidden text-end font-semibold`}>{project.dataCount.toLocaleString()}</div>
            </div>
            <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
              <div className="w-full text-start text-xs">목표변수</div>
              <div className={`text-md w-full overflow-hidden text-end font-semibold ${project.target ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                {project.target || '학습대기중'}
              </div>
            </div>
            <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
              <div className="w-full text-start text-xs">학습시간</div>
              <div className={`text-md w-full overflow-hidden text-end font-semibold ${project.runningDuration ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                {project.runningDuration || '학습대기중'}
              </div>
            </div>
            {project.category === 'CLASSIFICATION' ? (
              <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
                <div className="w-full text-start text-xs">정확도</div>
                <div className={`text-md w-full overflow-hidden text-end font-semibold ${project.accuracy ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                  {project.accuracy ? `${(project.accuracy * 100).toFixed(2)}%` : '학습대기중'}
                </div>
              </div>
            ) : (
              <div className="h-12 w-20 rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)]">
                <div className="w-full text-start text-xs">R²</div>
                <div className={`text-md w-full overflow-hidden text-end font-semibold ${project.rsquared ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                  {project.rsquared ? (project.rsquared * 100).toFixed(2) : '학습대기중'}
                </div>
              </div>
            )}
          </div>
          {/* 하단 버튼 */}
          <div className="mt-4 flex justify-end gap-3 select-none">
            {project.status === 'COMPLETED' && (
              <button
                className="border-[theme(color-gray-01)] hover:border-[theme(primary-black)] text-[theme(color-gray-01)] text-md h-10 w-20 cursor-pointer rounded-md border border-2 duration-600 ease-out"
                onClick={handleProjectClick}
              >
                상세
              </button>
            )}
            {project.status === 'PREPROCESSED' && (
              <button
                className="bg-[theme(primary-black)] hover:bg-[theme(color-gray-01)] text-md h-10 w-20 cursor-pointer rounded-md text-white duration-600 ease-out"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation(); // 이벤트 버블링 중단
                  handleAfterSchoolClick(project.id);
                }}
              >
                재학습
              </button>
            )}
            {project.status === 'FAILED' && (
              <button
                className="bg-[theme(primary-black)] hover:bg-[theme(color-gray-01)] text-md h-10 w-20 cursor-pointer rounded-md text-white duration-600 ease-out"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation(); // 이벤트 버블링 중단
                  handleAfterSchoolClick(project.id);
                }}
              >
                재학습
              </button>
            )}

            {project.status === 'COMPLETED' && <AfterSchoolDropdown project={project} />}

            {project.status === 'LEARNING' && (
              <button className="bg-[theme(color-gray-01)] hover:bg-[theme(primary-black)] text-md h-10 w-20 cursor-pointer rounded-md text-white duration-600 ease-out">학습중</button>
            )}
          </div>
        </section>
      </center>
    </div>
  );
};
