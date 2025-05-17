'use client';

import React from 'react';
import { CategoryTabsForOpenSource } from '@/features/dashboard/CategoryTabsForOpenSource';
import { SearchBar } from '@/features/dashboard/SearchBar'; // 검색 컴포넌트 가정
import { ProjectGridForOpenSource } from '@/widgets/project/project-grid/ui/ProjectGridForOpenSource';
import { useOpenSource } from '@/app/open-source/model/useOpenSource';
import { NewProjectButton } from '@/features/dashboard/NewProjectButton';

export default function Page() {
  const { openSourceData, isLoading, error, filteredProjects, selectedCategory, selectedSort, handleCategoryChange, handleSortChange, handleSearch } = useOpenSource();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류 발생: {error}</div>;
  }

  return (
    <div className="container mx-auto w-[80vw] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-5xl font-bold tracking-tighter">OpenSource</h1>
        <NewProjectButton />
      </div>
      {/* <h1 className="mb-8 text-3xl font-bold">오픈소스 프로젝트</h1> */}

      <div className="bg-[theme(primary-white)] mb-6 flex flex-col items-start justify-between rounded-md px-2 py-2 md:flex-row md:items-center">
        <CategoryTabsForOpenSource selectedCategory={selectedCategory} selectedSort={selectedSort} onCategoryChange={handleCategoryChange} onSortChange={handleSortChange} />

        <SearchBar onSearch={handleSearch} />
      </div>

      <ProjectGridForOpenSource projects={filteredProjects} />
    </div>
  );
}
