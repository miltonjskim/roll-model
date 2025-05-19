import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useAtom } from 'jotai';
import { FaTrashAlt } from 'react-icons/fa';
import { TiLockClosed } from 'react-icons/ti';
import { TiLockOpen } from 'react-icons/ti';
import { deletePipeline, toggePublicPipeline } from '@/shared/api/projectDetailApi';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAfterSchool } from '@/features/project-detail/useAfterSchool';
import { DOMAIN_STYLES } from '@/shared/ui/project-cards/DomainStyles';
import confetti from 'canvas-confetti';

export default function ProjectDetailHeader() {
  const [projectDetail, setProjectDetail] = useAtom(projectDetailAtom);
  const [showDropdown, setShowDropdown] = useState(false);
  const { handleAfterSchoolClick, moveToPreprocessing } = useAfterSchool();
  const router = useRouter();
  // confetti
  const iconRef = useRef<HTMLDivElement>(null);
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  // 파이프라인 삭제
  const handleDeletePipeline = async () => {
    try {
      await deletePipeline(projectDetail.id);
      router.push('/dashboard');
      alert('삭제 성공');
    } catch (e) {
      console.error('삭제실패', e);
      alert('삭제 실패');
      router.push('/dashboard');
    }
  };

  // 공개여부 버튼 클릭 핸들러
  const handleTogglePublic = async () => {
    // 프로젝트 비공개 상태면 전환 불가
    if (!projectDetail.projectPublicYn) {
      return;
    }
    // 현재 상태 저장한 뒤 우선 화면에 적용 바로 딱
    const previousPublicState = projectDetail.pipelinePublicYn;
    const newPipelinePublicYn = !previousPublicState;
    setProjectDetail({
      ...projectDetail,
      pipelinePublicYn: newPipelinePublicYn,
    });
    try {
      // API 호출
      await toggePublicPipeline(projectDetail.id, newPipelinePublicYn);
    } catch (e) {
      // 실패 시 이전 상태로 롤백
      setProjectDetail({
        ...projectDetail,
        pipelinePublicYn: previousPublicState,
      });
      console.error('공개 상태 변경 실패', e);
    }
  };

  // 버튼 색상 및 스타일 결정
  const getPublicButtonStyle = () => {
    if (!projectDetail.projectPublicYn) {
      // 비활성화 상태 (회색)
      return {
        borderColor: 'border-[theme(--color-gray-01)]',
        textColor: 'text-[theme(--color-gray-01)]',
      };
    } else if (projectDetail.pipelinePublicYn) {
      // 공개 상태 (노란색)
      return {
        borderColor: 'border-[theme(--color-green-01)]',
        textColor: 'text-[theme(--color-green-01)]',
      };
    } else {
      // 비공개 상태 (초록색)
      return {
        borderColor: 'border-[theme(--color-yellow-01)]',
        textColor: 'text-[theme(--color-yellow-01)]',
      };
    }
  };

  const buttonStyle = getPublicButtonStyle();

  const contentRef = useRef<HTMLDivElement>(null);

  const [contentVisible, setContentVisible] = useState(false);
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (showDropdown) {
      timer = setTimeout(() => {
        setContentVisible(true);
      }, 200); // 0.6초 후 내용 표시
    } else {
      setContentVisible(false);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [showDropdown]);

  // 도메인 정보
  function GetDomainIndex(n: string): number {
    let sum = 0;
    for (let i = 0; i < n.length; i++) {
      sum += n.charCodeAt(i);
    }
    return sum % 4;
  }
  const domainIndex = GetDomainIndex(projectDetail.title);
  const domainStyle = DOMAIN_STYLES[projectDetail.domain] || DOMAIN_STYLES['GENERAL'];
  const domainIcon = domainStyle.icons[domainIndex];
  const domainColor = domainStyle.colors[domainIndex];

  // confetti 트리거 함수
  const triggerConfetti = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isConfettiActive || !iconRef.current) return;

    setIsConfettiActive(true);

    const iconElement = iconRef.current;
    const rect = iconElement.getBoundingClientRect();

    // 아이콘의 중앙을 기준으로 confetti 생성
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight + 0.05;

    confetti({
      particleCount: 50,
      spread: 80,
      origin: { x, y },
      disableForReducedMotion: true,
      zIndex: 1000,
      colors: ['#ffb6c1', '#add8e6', '#90ee90', '#ffffe0', '#e6e6fa'],
      shapes: ['circle', 'square'],
      ticks: 80,
      scalar: 0.5,
      startVelocity: 8,
      gravity: 0.3,
    });

    setTimeout(() => {
      setIsConfettiActive(false);
    }, 2000);
  };

  return (
    <>
      <div className="mb-4 items-center justify-between gap-3 md:flex">
        {/* 흰색영역 */}
        <div className="flex h-24 w-full items-center space-x-4 rounded-[var(--radius-lg)] bg-[var(--primary-white)] p-4 shadow-md">
          {/* 아이콘 */}
          <div className={`${domainColor} flex h-[4rem] w-[4rem] cursor-pointer items-center justify-center overflow-hidden rounded-lg select-none`}>
            <div className={`flex w-full justify-center rounded-lg text-[3rem] transition-all duration-600 hover:text-[3.5rem]`} onClick={triggerConfetti} ref={iconRef}>
              {domainIcon}
            </div>
          </div>
          {/* 아이콘 옆 정보 */}
          <div>
            <h1 className="truncate text-start font-bold md:text-lg lg:text-xl">{projectDetail.title}</h1>
            <div className="mt-1 flex space-x-2 truncate text-sm text-[var(--color-gray-01)]">
              <p>{getDomainDisplayName(projectDetail.domain)}</p>
              <p>|</p>
              <p>{projectDetail.category === 'CLASSIFICATION' ? '분류' : '회귀'}</p>
              <p>|</p>
              <p>버전: {projectDetail.version}</p>
            </div>
          </div>
        </div>
        {/* 버튼 */}
        <div className="mt-2 flex h-24 justify-center space-x-3 md:mt-0">
          {/* 기타버튼 */}
          {projectDetail.ownerYn && (
            <>
              {/* 삭제버튼 */}
              <button
                className="flex w-12 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-black)] text-[var(--color-rose-01)] shadow-md select-none"
                onClick={handleDeletePipeline}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-rose-01)]">
                  <FaTrashAlt className="text-sm" />
                </div>
              </button>
              {/* 공개여부 버튼 */}
              <button
                className={`flex items-end justify-center rounded-[var(--radius-lg)] bg-[var(--primary-black)] shadow-md ${buttonStyle.textColor} w-12 cursor-pointer select-none`}
                onClick={handleTogglePublic}
                disabled={!projectDetail.projectPublicYn}
              >
                <div className="mb-2 flex flex-col items-center justify-center">
                  <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 ${buttonStyle.borderColor}`}>
                    {!projectDetail.projectPublicYn || projectDetail.pipelinePublicYn ? <TiLockOpen className="text-xl" /> : <TiLockClosed className="text-xl" />}
                  </div>
                  <div className="rounded-sm bg-[var(--primary-white)]/10 px-1 text-xs text-white">{!projectDetail.projectPublicYn || projectDetail.pipelinePublicYn ? '공개' : '비공개'}</div>
                </div>
              </button>
            </>
          )}
          {/* 재학습버튼 */}
          <div className="flex h-24">
            <button
              className={`h-full cursor-pointer rounded-[var(--radius-lg)] bg-[var(--primary-black)] px-4 text-white shadow-md transition-all duration-600 ease-in-out select-none ${showDropdown ? 'w-40' : 'w-20'} `}
              // onClick={() => setShowDropdown(!showDropdown)}
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {!showDropdown && <div>재학습</div>}

              {showDropdown && (
                <div
                  className="flex flex-col gap-1"
                  style={{
                    opacity: contentVisible ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                  }}
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <button
                    className="cursor-pointer rounded-md border border-[var(--color-gray-01)] px-3 py-2 text-sm whitespace-nowrap text-white duration-300 ease-in-out select-none hover:border-[var(--color-rose-02)]"
                    onClick={() => moveToPreprocessing(projectDetail.id, projectDetail.title)}
                  >
                    전처리부터 재학습
                  </button>
                  <button
                    className="cursor-pointer rounded-md border border-[var(--color-gray-01)] px-3 py-2 text-sm whitespace-nowrap text-white duration-300 ease-in-out select-none hover:border-[var(--color-rose-02)]"
                    onClick={() => handleAfterSchoolClick(projectDetail.id)}
                  >
                    모델링부터 재학습
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
