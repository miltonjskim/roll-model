import { DashboardSummary } from "@/entities/dashboard/model/types";
import { StatsCard } from "./statsCard";

interface StatsGridProps {
  summary: DashboardSummary;
}

export const StatsGrid = ({ summary }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatsCard title="전체 프로젝트" value={summary.totalProjects} />
      <StatsCard
        title="완료된 프로젝트"
        value={summary.completedProjectCount}
      />
      <StatsCard
        title="진행 중인 프로젝트"
        value={summary.inProgressProjectCount}
      />
      <StatsCard title="공개 프로젝트" value={summary.publicProjectCount} />
    </div>
  );
};
