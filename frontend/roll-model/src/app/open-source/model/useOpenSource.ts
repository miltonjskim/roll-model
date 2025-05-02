"use client";

import { useEffect, useState } from "react";
import {
  OpenSourceData,
  OpenSourceProject,
  ProjectType,
} from "@/entities/open-source/model/types";
import {
  fetchFilteredOpenSourceProjects,
  fetchOpenSourceData,
} from "@/shared/api/openSourceApi";

// 정렬 옵션 타입
export type SortOption = "recent" | "popular";

export function useOpenSource() {
  const [openSourceData, setOpenSourceData] = useState<OpenSourceData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터링 및 검색 상태
  const [selectedCategory, setSelectedCategory] = useState<"all" | ProjectType>(
    "all"
  );
  const [selectedSort, setSelectedSort] = useState<SortOption>("recent"); // 기본 정렬은 최신순
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<OpenSourceProject[]>(
    []
  );

  // 프로젝트 필터링 로딩 상태
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    const loadOpenSourceData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchOpenSourceData();
        setOpenSourceData(response.data);
        setFilteredProjects(response.data?.projects || []);
        setError(null);
      } catch (err) {
        setError("데이터를 불러오는데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOpenSourceData();
  }, []);

  // 카테고리, 정렬 옵션, 검색어 변경 시 프로젝트 필터링
  useEffect(() => {
    if (!openSourceData) return;

    const applyFilters = async () => {
      try {
        setIsFilterLoading(true);
        const response = await fetchFilteredOpenSourceProjects(
          selectedCategory,
          searchQuery,
          selectedSort // 정렬 옵션 전달
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
  }, [openSourceData, selectedCategory, selectedSort, searchQuery]);

  const handleCategoryChange = (category: "all" | ProjectType) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (sortOption: SortOption) => {
    setSelectedSort(sortOption);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return {
    openSourceData,
    isLoading,
    error,
    filteredProjects,
    isFilterLoading,
    selectedCategory,
    selectedSort,
    handleCategoryChange,
    handleSortChange,
    handleSearch,
  };
}
