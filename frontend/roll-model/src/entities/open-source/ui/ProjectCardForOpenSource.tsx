import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { useSetAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useRouter } from 'next/navigation';
import { OpenSourceProject } from '@/entities/open-source/model/types';

interface ProjectCardProps {
  project: OpenSourceProject;
}

export const ProjectCardForOpenSource = ({ project }: ProjectCardProps) => {
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
    <div className="cursor-pointer rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md" onClick={handleProjectClick}>
      <div className="mb-2 flex items-start justify-between">
        <h2 className="truncate text-lg font-bold">{project.title}</h2>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        <p>타입: {project.category === 'CLASSIFICATION' ? '분류' : '회귀'}</p>
        <p>도메인: {project.displayDomain || getDomainDisplayName(project.domain)}</p>
        <p>목표변수: {project.target}</p>
        <p>데이터 수: {project.dataCount.toLocaleString()}</p>
        <p>버전 : {project.version}</p>
        <p>학습시간 : {project.runnungDuration}</p>
        <p>주인장번호 : {project.writerId}</p>
        <p>주인장이름 : {project.writerNickname}</p>
        {project.accuracy && <p>정확도: {project.accuracy}%</p>}
        {project.rmse && <p>RMSE: {project.rmse}</p>}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span className="flex items-center">
          <span className="mr-1">❤️</span> {project.likeCount}
        </span>
        <span className="flex items-center">
          <span className="mr-1">⬇️</span> {project.downloadCount}
        </span>
        <span className="flex items-center">
          <span className="mr-1">{project.visibility ? '🌐' : '🔒'}</span>
          {project.visibility ? '공개' : '비공개'}
        </span>
        <span className="flex items-center">
          <span className="mr-1">⏱️</span>
          {new Date(project.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
