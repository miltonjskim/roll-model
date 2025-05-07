import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useAtom } from 'jotai';
import { FaTrashAlt } from 'react-icons/fa';
import { TiLockClosed } from 'react-icons/ti';
import { TiLockOpen } from 'react-icons/ti';

export default function ProjectDetailHeader() {
  const [projectDetail, setProjectDetail] = useAtom(projectDetailAtom);

  // 재학습
  const handleStartRetraining = () => {
    // 재학습 api
  };

  // 파이프라인 삭제
  const handleDeletePipeline = () => {};

  // 공개여부 버튼 클릭 핸들러
  const handleTogglePublic = () => {
    // 프로젝트 비공개
    if (!projectDetail.projectPublicYn) {
      return; // 비활성화 상태 (전환불가능)
    }
    const newPipelinePublicYn = !projectDetail.pipelinePublicYn;
    setProjectDetail({
      ...projectDetail,
      pipelinePublicYn: newPipelinePublicYn,
    });
    // API 요청 (아직없)
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
        borderColor: 'border-[theme(--color-yellow-01)]',
        textColor: 'text-[theme(--color-yellow-01)]',
      };
    } else {
      // 비공개 상태 (초록색)
      return {
        borderColor: 'border-[theme(--color-green-01)]',
        textColor: 'text-[theme(--color-green-01)]',
      };
    }
  };

  const buttonStyle = getPublicButtonStyle();

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
                className={`flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-black)] shadow-sm ${buttonStyle.textColor} w-16 cursor-pointer select-none`}
                onClick={handleTogglePublic}
                disabled={!projectDetail.projectPublicYn}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${buttonStyle.borderColor}`}>
                  {!projectDetail.projectPublicYn || projectDetail.pipelinePublicYn ? <TiLockOpen className="text-xl" /> : <TiLockClosed className="text-xl" />}
                </div>
              </button>
            </>
          )}
          <button className="w-20 cursor-pointer rounded-[var(--radius-lg)] bg-[var(--primary-black)] p-4 text-white shadow-sm select-none" onClick={handleStartRetraining}>
            재학습
          </button>
        </div>
      </div>
    </>
  );
}
