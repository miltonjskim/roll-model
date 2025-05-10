import { Project } from '@/entities/dashboard/model/types';
import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { formatDate, getRelativeTime } from '@/shared/lib/utils/dateUtils';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const setProjectDetail = useSetAtom(projectDetailAtom);
  const router = useRouter();

  const handleProjectClick = () => {
    // atom 상태 업데이트
    setProjectDetail({
      id: project.id,
      title: project.title,
      version: project.version,
      category: project.category,
      domain: project.domain,
      ownerYn: false, // 초기값은 false로 설정
    });

    // 프로젝트 상세 페이지로 라우팅
    router.push(`/project-detail/${project.id}`);
  };
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex cursor-default items-start justify-between select-none">
        <h2 className="truncate text-lg font-bold">{project.title}</h2>
        <span
          className={`rounded px-2 py-1 text-xs ${
            project.status === 'COMPLETED'
              ? project.publicYn
                ? 'bg-green-100 text-green-800' // 완료&공개
                : 'bg-blue-100 text-blue-800' // 완료&비공개
              : project.status === 'PREPROCESSED'
                ? 'bg-yellow-100 text-yellow-800' // 작업중
                : project.status === 'LEARNING'
                  ? 'bg-purple-100 text-purple-800' // 학습중
                  : 'bg-red-100 text-red-800' // 실패
          }`}
        >
          {project.status === 'COMPLETED' ? (project.publicYn ? '공개' : '비공개') : project.status === 'PREPROCESSED' ? '작업중' : project.status === 'LEARNING' ? '학습중' : '실패'}
        </span>
      </div>

      <div className="mb-4 cursor-default text-sm text-gray-500 select-none">
        <p>타입: {project.category === 'CLASSIFICATION' ? '분류' : '회귀'}</p>
        <p>도메인: {project.displayDomain || getDomainDisplayName(project.domain)}</p>
        <p>목표변수: {project.target || '학습대기중'}</p>
        <p>데이터 수: {project.dataCount.toLocaleString()}</p>
        <p>버전 : {project.version || 'X'}</p>
        <p>학습시간 : {project.runnungDuration || '학습대기중'}</p>
        {project.category === 'CLASSIFICATION' ? (
          <p>정확도: {project.accuracy ? `${(project.accuracy * 100).toFixed(2)}%` : '학습대기중'}</p>
        ) : (
          <p>RMSE: {project.rmse ? project.rmse.toFixed(4) : '학습대기중'}</p>
        )}
        {/* <p>{formatDate(project.updatedAt, 'yyyy-MM-dd')} 수정됨</p> */}
        <p>{getRelativeTime(project.updatedAt)} 수정됨</p>
      </div>

      <div className="flex cursor-default justify-between text-xs text-gray-500 select-none">
        <span className="flex items-center">
          <span className="mr-1">❤️</span> {project.likeCount}
        </span>
        <span className="flex items-center">
          <span className="mr-1">⬇️</span> {project.downloadCount}
        </span>
        <span className="flex items-center">
          <span className="mr-1">{project.publicYn ? '🌐' : '🔒'}</span>
          {project.publicYn ? '공개' : '비공개'}
        </span>
        <span className="flex items-center">
          <span className="mr-1">⏱️</span>
          {new Date(project.updatedAt).toLocaleDateString()}
        </span>
      </div>
      <div className="mt-4 flex justify-end gap-3 select-none">
        {project.status === 'COMPLETED' && (
          <button className="bg-[theme(color-gray-01)] hover:bg-[theme(primary-black)] w-20 cursor-pointer rounded-md px-3 py-2 text-white duration-600 ease-out" onClick={handleProjectClick}>
            상세
          </button>
        )}
        <button className="bg-[theme(primary-black)] hover:bg-[theme(color-gray-01)] w-20 cursor-pointer rounded-md px-3 py-2 text-white duration-600 ease-out">재학습</button>
      </div>
    </div>
  );
};
