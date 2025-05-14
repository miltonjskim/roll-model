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

export default function ProjectDetailHeader() {
  const [projectDetail, setProjectDetail] = useAtom(projectDetailAtom);
  const [showDropdown, setShowDropdown] = useState(false);
  const { handleAfterSchoolClick, moveToPreprocessing } = useAfterSchool();
  const router = useRouter();

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
      // 성공 시 알림 (선택사항)
      alert('공개 여부가 변경되었습니다.');
    } catch (e) {
      // 실패 시 이전 상태로 롤백
      setProjectDetail({
        ...projectDetail,
        pipelinePublicYn: previousPublicState,
      });
      console.error('공개 상태 변경 실패', e);
      alert('공개 여부 변경에 실패했습니다.');
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

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="h-24 w-full rounded-[var(--radius-lg)] bg-[var(--primary-white)] p-4 shadow-sm">
          <h1 className="text-12 font-bold md:text-lg lg:text-xl">{projectDetail.title}</h1>
          <div className="mt-1 flex space-x-4 text-sm text-[var(--color-gray-01)]">
            <span>타입: {projectDetail.category === 'CLASSIFICATION' ? '분류' : '회귀'}</span>
            <span>도메인: {getDomainDisplayName(projectDetail.domain)}</span>
            <span>버전: {projectDetail.version}</span>
          </div>
        </div>
        <div className="flex h-24 space-x-2">
          {projectDetail.ownerYn && (
            <>
              <button
                className="flex w-16 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-black)] text-[var(--color-rose-01)] shadow-sm select-none"
                onClick={handleDeletePipeline}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-rose-01)]">
                  <FaTrashAlt className="text-sm" />
                </div>
              </button>
              {/* 공개여부 버튼 */}
              <button
                className={`flex items-end justify-center rounded-[var(--radius-lg)] bg-[var(--primary-black)] shadow-sm ${buttonStyle.textColor} w-16 cursor-pointer select-none`}
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

          <div className="flex h-24">
            <button
              className={`h-full cursor-pointer rounded-[var(--radius-lg)] bg-[var(--primary-black)] px-4 text-white shadow-sm transition-all duration-600 ease-in-out select-none ${showDropdown ? 'w-40' : 'w-20'} `}
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
