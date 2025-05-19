import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { useSetAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useRouter } from 'next/navigation';
import { OpenSourceProject } from '@/entities/open-source/model/types';
import { getRelativeTime } from '@/shared/lib/utils/dateUtils';
import { useState, useRef } from 'react';
import { likeThisPipeline } from '@/shared/api/openSourceApi';
import { useAfterSchool } from '@/features/project-detail/useAfterSchool';
import { AfterSchoolDropdown } from '@/features/project-detail/AfterSchoolDropdown';
import { DOMAIN_STYLES } from '@/shared/ui/project-cards/DomainStyles';
import confetti from 'canvas-confetti';

interface ProjectCardProps {
  project: OpenSourceProject;
}

export const ProjectCardForOpenSource = ({ project }: ProjectCardProps) => {
  const setProjectDetail = useSetAtom(projectDetailAtom);
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(project.likeYn);
  const { handleAfterSchoolClick } = useAfterSchool();
  const [showDropdown, setShowDropdown] = useState('');
  // confetti
  const iconRef = useRef<HTMLDivElement>(null);
  const [isConfettiActive, setIsConfettiActive] = useState(false);

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

  // 도메인 정보
  function GetDomainIndex(n: string): number {
    let sum = 0;
    for (let i = 0; i < n.length; i++) {
      sum += n.charCodeAt(i);
    }
    return sum % 4;
  }
  const domainIndex = GetDomainIndex(project.title);
  const domainStyle = DOMAIN_STYLES[project.domain] || DOMAIN_STYLES['GENERAL'];
  const domainIcon = domainStyle.icons[domainIndex];
  const domainColor = domainStyle.colors[domainIndex];
  const domainBorder = domainStyle.borders[domainIndex];

  const handleLikeClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const preLiked = isLiked;
    const newLiked = !preLiked;
    setIsLiked(newLiked);
    try {
      await likeThisPipeline(project.id, newLiked);
    } catch (e) {
      setIsLiked(preLiked);
      console.error('아..사실 싫어요', e);
    }
  };

  // confetti 트리거 함수
  const triggerConfetti = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isConfettiActive || !iconRef.current) return;

    setIsConfettiActive(true);

    const iconElement = iconRef.current;
    const rect = iconElement.getBoundingClientRect();

    // 아이콘의 중앙을 기준으로 confetti 생성
    const x = (rect.left + rect.width / 2) / window.innerWidth + 0.01;
    const y = (rect.top + rect.height / 2) / window.innerHeight + 0.05;

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { x, y },
      disableForReducedMotion: true,
      zIndex: 1000,
      colors: ['#ffb6c1', '#add8e6', '#90ee90', '#ffffe0', '#e6e6fa'],
      shapes: ['circle', 'square'],
      ticks: 80,
      scalar: 0.8,
      startVelocity: 10,
      gravity: 0.3,
    });

    setTimeout(() => {
      setIsConfettiActive(false);
    }, 2000);
  };

  return (
    <div>
      <div className="cursor-pointer rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* 헤더 */}
        <div className="bg-[theme(primary-black)] flex cursor-default items-center justify-between rounded-t-xl px-3 py-2 text-white select-none">
          {/* 헤더/왼쪽 */}
          <div className="flex max-w-[70%] items-center space-x-2 overflow-hidden">
            <h2 className="truncate text-lg font-semibold">{project.title}</h2>
            {project.category === 'CLASSIFICATION' ? (
              <div className="bg-[theme(color-green-02)] rounded-sm px-1 py-0.5 text-xs font-semibold whitespace-nowrap text-gray-600">분류</div>
            ) : (
              <div className="bg-[theme(color-yellow-02)] rounded-sm px-1 py-0.5 text-xs font-semibold whitespace-nowrap text-gray-600">회귀</div>
            )}
          </div>
          {/* 헤더/오른쪽 */}
          <div className="flex items-center space-x-2">
            <div>
              <button className="cursor-pointer" onClick={handleLikeClick}>
                {isLiked ? '❤️' : '🤍'}
              </button>
            </div>
            <div className="rounded-sm bg-[var(--primary-white)]/10 px-1 text-sm whitespace-nowrap">{project.writerNickname}</div>
          </div>
        </div>

        <center onClick={handleProjectClick} className="flex items-center justify-between p-4 select-none">
          {/* 센터 왼쪽 */}
          <section className="w-[7.5rem]">
            <div className="relative mt-3 mb-4 ml-2">
              <div className={`${domainColor} flex h-[7rem] w-[7rem] items-center justify-center overflow-hidden rounded-lg`}>
                <div className={`w-full rounded-lg text-[4.5rem] transition-all duration-600 hover:text-[5rem]`} onClick={triggerConfetti} ref={iconRef}>
                  {domainIcon}
                </div>
              </div>
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
              <div className="w-full text-start text-xs text-gray-400">{getRelativeTime(project.updatedAt)} 수정됨</div>
            </div>
          </section>

          {/* 센터 오른쪽 */}
          <section>
            {/* 그리드 */}
            <div
              className={`mb-4 h-26 overflow-hidden transition-all duration-600 ${showDropdown === project.id ? 'grid w-42 grid-cols-2 gap-2' : 'block w-42'}`}
              onMouseEnter={() => setShowDropdown(project.id)}
              onMouseLeave={() => setShowDropdown('')}
            >
              <div
                className={`rounded-md border border-[var(--color-gray-03)] text-sm text-[var(--primary-black)] transition-all duration-300 ${showDropdown === project.id ? 'h-12 w-20 p-1 opacity-100' : 'h-0 overflow-hidden opacity-0'}`}
              >
                <div className="w-full text-start text-xs">데이터 수</div>
                <div className={`text-md w-full overflow-hidden text-end font-semibold`}>{project.dataCount.toLocaleString()}</div>
              </div>

              <div
                className={`rounded-md border border-[var(--color-gray-03)] text-sm text-[var(--primary-black)] transition-all duration-300 ${showDropdown === project.id ? 'h-12 w-20 p-1 opacity-100' : 'h-0 overflow-hidden opacity-0'}`}
              >
                <div className="w-full text-start text-xs">목표변수</div>
                <div className={`text-md w-full overflow-hidden text-end font-semibold ${project.target ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                  {project.target || '학습대기중'}
                </div>
              </div>

              <div
                className={`rounded-md border border-[var(--color-gray-03)] text-sm text-[var(--primary-black)] transition-all duration-300 ${showDropdown === project.id ? 'h-12 w-20 p-1 opacity-100' : 'h-0 overflow-hidden opacity-0'}`}
              >
                <div className="w-full text-start text-xs">학습시간</div>
                <div className={`text-md w-full overflow-hidden text-end font-semibold ${project.runningDuration ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}>
                  {project.runningDuration ? `${(project.runningDuration * 1000).toFixed(2)}ms` : '학습대기중'}
                </div>
              </div>

              {project.category === 'CLASSIFICATION' ? (
                <div
                  className={`rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)] transition-all duration-300 ${showDropdown === project.id ? 'h-12 w-20 opacity-100' : 'flex h-[calc(100%-6px)] w-full flex-col justify-between p-3 opacity-100'}`}
                >
                  <div className={`w-full text-start ${showDropdown === project.id ? 'text-xs' : 'text-lg'}`}>정확도</div>
                  <div
                    className={` ${showDropdown === project.id ? 'text-md' : 'text-3xl'} w-full overflow-hidden text-end font-semibold ${project.accuracy ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}
                  >
                    {project.accuracy ? `${(project.accuracy * 100).toFixed(2)}%` : '학습대기중'}
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-md border border-[var(--color-gray-03)] p-1 text-sm text-[var(--primary-black)] transition-all duration-300 ${showDropdown === project.id ? 'h-12 w-20 opacity-100' : 'flex h-[calc(100%-6px)] w-full flex-col justify-between p-3 opacity-100'}`}
                >
                  <div className={`w-full text-start ${showDropdown === project.id ? 'text-xs' : 'text-2xl'}`}>R²</div>
                  <div
                    className={` ${showDropdown === project.id ? 'text-md' : 'text-3xl'} w-full overflow-hidden text-end font-semibold ${project.rSquared ? 'text-[var(--primary-black)]' : 'text-[var(--color-gray-02)]'}`}
                  >
                    {project.rSquared ? `${(project.rSquared * 100).toFixed(1)}%` : '학습대기중'}
                  </div>
                </div>
              )}
            </div>
            {/* 하단 버튼 */}
            <div className="mt-4 flex justify-end gap-3 select-none">
              {project.status === 'COMPLETED' && (
                <button
                  className="border-[theme(color-gray-01)] hover:border-[theme(primary-black)] text-[theme(color-gray-01)] text-md h-10 w-20 cursor-pointer rounded-md border border-2 duration-300 ease-out hover:font-semibold"
                  onClick={handleProjectClick}
                >
                  상세
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
    </div>
  );
};
