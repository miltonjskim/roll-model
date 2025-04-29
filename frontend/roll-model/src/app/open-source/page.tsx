"use client";

import React from "react";
import { useOpenSource } from "./model/useOpenSource";
import { CategoryTabsForOpenSource } from "@/features/dashboard/CategoryTabsForOpenSource";
import { SearchBar } from "@/features/dashboard/SearchBar"; // 검색 컴포넌트 가정
import { ProjectGridForOpenSource } from "@/widgets/project/project-grid/ui/ProjectGridForOpenSource";

export default function Page() {
  const {
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
  } = useOpenSource();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류 발생: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">오픈소스 프로젝트</h1>

      <div className="flex justify-between items-center mb-6">
        <CategoryTabsForOpenSource
          selectedCategory={selectedCategory}
          selectedSort={selectedSort}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
        />

        <SearchBar onSearch={handleSearch} />
      </div>

      {isFilterLoading ? (
        <div>필터링 중...</div>
      ) : (
        // <ProjectList projects={filteredProjects} />
        <ProjectGridForOpenSource projects={filteredProjects} />
        // <div>temp</div>
      )}
    </div>
  );
}
