"use client";

import { StatsGrid } from "@/widgets/dashboard/dashboard-stats/ui/statsGrid";
import { ProjectGrid } from "@/widgets/dashboard/project-grid/ui/projectGrid";
import { CategoryTabs } from "@/features/dashboard/project-filtering/ui/categoryTabs";
import { SearchBar } from "@/features/dashboard/project-search/ui/searchBar";
import { NewProjectButton } from "@/features/dashboard/project-actions/ui/newProjectButton";
import { useDashboard } from "./model/useDashboard";

export default function DashboardPage() {
  const {
    dashboardData,
    isLoading,
    error,
    filteredProjects,
    isFilterLoading,
    selectedCategory,
    handleCategoryChange,
    handleSearch,
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        로딩중 ...
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          {error || "데이터를 불러오는데 실패했습니다."}
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <NewProjectButton />
      </div>

      {/* 통계 요약 섹션 */}
      <StatsGrid summary={dashboardData.summary} />

      {/* 프로젝트 검색 및 필터 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="mb-4 md:mb-0">
          <CategoryTabs
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* 프로젝트 그리드 */}
      {isFilterLoading ? (
        <div className="py-10">그리드 로딩중...</div>
      ) : (
        <ProjectGrid projects={filteredProjects} />
      )}
    </div>
  );
}
