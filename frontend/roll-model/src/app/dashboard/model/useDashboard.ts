import { useEffect, useState } from "react";
import {
  DashboardData,
  Project,
  ProjectType,
} from "@/entities/project/model/types";
import {
  fetchDashboardData,
  fetchFilteredProjects,
} from "@/shared/api/projectApi";

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 필터링 및 검색 상태
  const [selectedCategory, setSelectedCategory] = useState<"all" | ProjectType>(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  // 프로젝트 필터링 로딩 상태
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);

  // 초기 데이터 로드
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchDashboardData();
        setDashboardData(response.data);
        setFilteredProjects(response.data?.projects || []);
        setError(null);
      } catch (err) {
        setError("데이터를 불러오는데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // 카테고리나 검색어 변경 시 프로젝트 필터링
  useEffect(() => {
    if (!dashboardData) return;

    const applyFilters = async () => {
      try {
        setIsFilterLoading(true);
        const response = await fetchFilteredProjects(
          selectedCategory,
          searchQuery
        );
        setFilteredProjects(response.data?.projects || []);
      } catch (err) {
        console.error("필터링 오류:", err);
      } finally {
        setIsFilterLoading(false);
      }
    };

    // 디바운스 처리
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [dashboardData, selectedCategory, searchQuery]);

  const handleCategoryChange = (category: "all" | ProjectType) => {
    setSelectedCategory(category);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return {
    dashboardData,
    isLoading,
    error,
    filteredProjects,
    isFilterLoading,
    selectedCategory,
    handleCategoryChange,
    handleSearch,
  };
}
