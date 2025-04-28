"use client";

import { useEffect, useState } from "react";
import {
  DashboardData,
  DashboardResponse,
  Project,
  ProjectType,
} from "@/entities/project/model/types";
import { StatsGrid } from "@/widgets/dashboard-stats/ui/statsGrid";
import { ProjectGrid } from "@/widgets/project-grid/ui/projectGrid";
import { CategoryTabs } from "@/features/project-filtering/ui/categoryTabs";
import { SearchBar } from "@/features/project-search/ui/searchBar";

// 임시로 목업 데이터 직접 불러오기
import dashboardMock from "@/shared/api/mocks/dashboard.json";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 필터링 및 검색 상태
  const [selectedCategory, setSelectedCategory] = useState<"all" | ProjectType>(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  useEffect(() => {
    // 목업 데이터 로드 (실제 API 연동 전까지 사용)
    const mockData = dashboardMock as DashboardResponse;
    setDashboardData(mockData.data);
    setFilteredProjects(mockData.data?.projects || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!dashboardData) return;

    // 카테고리 및 검색어로 프로젝트 필터링
    let filtered = [...dashboardData.projects];

    // 카테고리 필터링
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (project) => project.type === selectedCategory
      );
    }

    // 검색어 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.target.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  }, [dashboardData, selectedCategory, searchQuery]);

  const handleCategoryChange = (category: "all" | ProjectType) => {
    setSelectedCategory(category);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>;
  }

  if (!dashboardData) {
    return <div className="p-8">데이터를 불러오는데 실패했습니다.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>

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
      <ProjectGrid projects={filteredProjects} />
    </div>
  );
}
