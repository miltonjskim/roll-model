import { DashboardSummary } from '@/entities/dashboard/model/types';
import { StatsCard } from '@/widgets/project/dashboard-stats/ui/StatsCard';

interface StatsGridProps {
  summary: DashboardSummary;
  selectedStatus: 'all' | 'COMPLETED' | 'PREPROCESSED' | 'FAILED_OR_LEARNING';
  onStatusChange: (status: 'all' | 'COMPLETED' | 'PREPROCESSED' | 'FAILED_OR_LEARNING') => void;
}

export const StatsGrid = ({ summary, selectedStatus, onStatusChange }: StatsGridProps) => {
  const runnigToFail = summary.totalProjects - summary.completedProjectCount - summary.inProgressProjectCount;
  return (
    <div className="bg-[theme(primary-white)] mb-8 grid grid-cols-1 gap-4 rounded-lg p-4 sm:grid-cols-2 md:grid-cols-4">
      <StatsCard title="전체 프로젝트" value={summary.totalProjects} icon="🎁" isSelected={selectedStatus === 'all'} onClick={() => onStatusChange('all')} />
      <StatsCard title="완성 프로젝트" value={summary.completedProjectCount} isSelected={selectedStatus === 'COMPLETED'} icon="🏆" onClick={() => onStatusChange('COMPLETED')} />
      <StatsCard title="전처리 프로젝트" value={summary.inProgressProjectCount} isSelected={selectedStatus === 'PREPROCESSED'} icon="📄" onClick={() => onStatusChange('PREPROCESSED')} />
      <StatsCard title="진행중/실패 프로젝트" value={runnigToFail} isSelected={selectedStatus === 'FAILED_OR_LEARNING'} icon="⚠️" onClick={() => onStatusChange('FAILED_OR_LEARNING')} />
    </div>
  );
};
