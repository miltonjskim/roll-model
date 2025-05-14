'use client';

import { StatsGrid } from '@/widgets/project/dashboard-stats/ui/StatsGrid';
import { ProjectGrid } from '@/widgets/project/project-grid/ui/ProjectGrid';
import { CategoryTabs } from '@/features/dashboard/CategoryTabs';
import { SearchBar } from '@/features/dashboard/SearchBar';
import { NewProjectButton } from '@/features/dashboard/NewProjectButton';
import { useDashboard } from '@/app/dashboard/model/useDashboard';

export default function Page() {
  const { dashboardData, isLoading, error, filteredProjects, selectedCategory, handleCategoryChange, handleSearch } = useDashboard();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">로딩중 ...</div>;
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 text-red-500">{error || '데이터를 불러오는데 실패했습니다.'}</div>
        <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto w-[80vw] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <NewProjectButton />
      </div>

      {/* 통계 요약 섹션 */}
      <StatsGrid summary={dashboardData.summary} />

      {/* 프로젝트 검색 및 필터 */}
      <div className="bg-[theme(primary-white)] mb-6 flex flex-col items-start justify-between rounded-md px-2 py-2 md:flex-row md:items-center">
        <div className="mb-4 md:mb-0">
          <CategoryTabs selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
        </div>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* 프로젝트 그리드 */}
      <ProjectGrid projects={filteredProjects} />
    </div>
  );
}
