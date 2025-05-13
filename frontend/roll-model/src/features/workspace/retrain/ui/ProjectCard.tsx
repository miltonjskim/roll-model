import { getDomainDisplayName } from '@/shared/lib/utils/domainMapping';
import { getRelativeTime } from '@/shared/lib/utils/dateUtils';
import { Project } from '@/entities/dashboard/model/types';

interface ProjectCardCompactProps {
  project: Project;
  onClick?: () => void;
}

export const ProjectCardCompact = ({ project, onClick }: ProjectCardCompactProps) => {
  console.log('project.category:', project.category);

  console.log('------------------------------');

  const handleAfterSchoolClick = (afterSchool: string) => {
    if (afterSchool !== 'COMPLETED') {
      // 전처리부터 재학습
    } else if (afterSchool === 'COMPLETED') {
      // 모델링부터 재학습
    }
  };

  return (
    <div className="cursor-pointer rounded-lg border border-[var(--color-gray-03)] bg-white p-4 shadow-sm transition-shadow select-none hover:shadow-md" onClick={onClick}>
      <div className="mb-2">
        <h2 className="truncate text-lg font-bold text-gray-900">{project.title}</h2>
        <p className="text-xs text-gray-400">{getRelativeTime(project.updatedAt)} 수정됨</p>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <p>타입: {project.category === 'CLASSIFICATION' ? '분류' : '회귀'}</p>
        <p>도메인: {project.displayDomain || getDomainDisplayName(project.domain)}</p>
        <p>목표변수: {project.target ? project.target : '없음'}</p>
        <p>데이터 수: {project.dataCount.toLocaleString()}</p>
        <p>버전: {project.version ? project.version : '0.0'}</p>
        <p>학습시간: {project.runningDuration !== undefined && project.runningDuration !== null ? project.runningDuration.toString() : 'N/A'}</p>

        {project.category === 'CLASSIFICATION' ? (
          <p>정확도: {project.accuracy != null ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(project.accuracy * 100)}%` : '학습대기중'}</p>
        ) : (
          <p>
            정확도 (R²):{' '}
            {project.rsquared != null
              ? `${new Intl.NumberFormat('en-US', {
                  maximumFractionDigits: 2,
                }).format(project.rsquared * 100)}%`
              : '학습대기중'}
          </p>
        )}
      </div>
    </div>
  );
};
