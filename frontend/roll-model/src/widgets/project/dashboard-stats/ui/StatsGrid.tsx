import { DashboardSummary } from '@/entities/dashboard/model/types';
import { StatsCard } from '@/widgets/project/dashboard-stats/ui/StatsCard';

interface StatsGridProps {
  summary: DashboardSummary;
}

export const StatsGrid = ({ summary }: StatsGridProps) => {
  return (
    <div className="bg-[theme(primary-white)] mb-8 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-4">
      <StatsCard title="전체 프로젝트" value={summary.totalProjects} icon="🎁" />
      <StatsCard title="완성 프로젝트" value={summary.completedProjectCount} icon="🏆" />
      <StatsCard title="전처리 프로젝트" value={summary.inProgressProjectCount} icon="🔧" />
      <StatsCard title="공개 프로젝트" value={summary.publicProjectCount} icon="🌟" />
    </div>
  );
};
