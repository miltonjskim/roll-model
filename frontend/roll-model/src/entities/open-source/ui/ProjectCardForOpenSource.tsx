import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { useSetAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useRouter } from 'next/navigation';
import { OpenSourceProject } from '@/entities/open-source/model/types';
import { getRelativeTime } from '@/shared/lib/utils/dateUtils';
import { useState } from 'react';
import { likeThisPipeline } from '@/shared/api/openSourceApi';

interface ProjectCardProps {
  project: OpenSourceProject;
}

export const ProjectCardForOpenSource = ({ project }: ProjectCardProps) => {
  const setProjectDetail = useSetAtom(projectDetailAtom);
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(project.likeYn);

  const handleProjectClick = () => {
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

  const handleLikeClick = async () => {
    const preLiked = isLiked;
    const newLiked = !preLiked;
    setIsLiked(newLiked);
    try {
      await likeThisPipeline(project.id, newLiked);
      alert('좋아요 성공.');
    } catch (e) {
      setIsLiked(preLiked);
      console.error('아..사실 싫어요', e);
      alert('좋아요 실패.');
    }
  };

  return (
    <div className="cursor-default rounded-lg bg-white p-4 shadow-sm transition-shadow select-none hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <h2 className="truncate text-lg font-bold">{project.title}</h2>
        <button className="cursor-pointer" onClick={handleLikeClick}>
          {isLiked ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        <p>타입: {project.category === 'CLASSIFICATION' ? '분류' : '회귀'}</p>
        <p>도메인: {project.displayDomain || getDomainDisplayName(project.domain)}</p>
        <p>목표변수: {project.target}</p>
        <p>데이터 수: {project.dataCount.toLocaleString()}</p>
        <p>버전 : {project.version}</p>
        <p>학습시간 : {project.runnungDuration}</p>
        {/* <p>주인장번호 : {project.writerId}</p> */}
        <p>주인장이름 : {project.writerNickname}</p>
        {project.category === 'CLASSIFICATION' ? (
          <p>정확도: {project.accuracy ? `${(project.accuracy * 100).toFixed(2)}%` : '학습대기중'}</p>
        ) : (
          <p>RMSE: {project.rmse ? project.rmse.toFixed(4) : '학습대기중'}</p>
        )}
        {/* <p>{formatDate(project.updatedAt, 'yyyy-MM-dd')} 수정됨</p> */}
        <p>{getRelativeTime(project.updatedAt)} 수정됨</p>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span className="flex items-center">
          <span className="mr-1">❤️</span> {project.likeCount}
        </span>
        <span className="flex items-center">
          <span className="mr-1">⬇️</span> {project.downloadCount}
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
