import { DashboardSummary } from '@/entities/dashboard/model/types';
import { StatsCard } from './StatsCard';

interface StatsGridProps {
  summary: DashboardSummary;
}

export const StatsGrid = ({ summary }: StatsGridProps) => {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      <StatsCard title="전체 프로젝트" value={summary.totalProjects} />
      <StatsCard title="완료된 프로젝트" value={summary.completedProjectCount} />
      <StatsCard title="진행 중인 프로젝트" value={summary.inProgressProjectCount} />
      <StatsCard title="공개 프로젝트" value={summary.publicProjectCount} />
    </div>
  );
};
