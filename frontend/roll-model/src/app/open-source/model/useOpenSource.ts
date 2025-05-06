'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { OpenSourceData, OpenSourceProject, ProjectType } from '@/entities/open-source/model/types';
import { fetchOpenSourceData } from '@/shared/api/openSourceApi';

// 정렬 옵션 타입
export type SortOption = 'recent' | 'name';

export function useOpenSource() {
  const [openSourceData, setOpenSourceData] = useState<OpenSourceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터링 및 검색 상태
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProjectType>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('recent'); // 기본 정렬은 최신순
  const [searchQuery, setSearchQuery] = useState('');

  // hhhhhhhhhhhhhhhhhhhhhhh하드코딩
  const page = 1;
  const size = 6;

  // 데이터 로드 함수를 useCallback으로 메모이제이션
  const loadOpenSourceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOpenSourceData(selectedCategory, searchQuery, selectedSort, page, size);
      setOpenSourceData(response.data);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, selectedSort]);

  // 초기 데이터 로드 및 필터링 변경 시 다시 로드
  useEffect(() => {
    loadOpenSourceData();
  }, [loadOpenSourceData]);

  const handleCategoryChange = useCallback((category: 'all' | ProjectType) => {
    setSelectedCategory(category);
  }, []);

  const handleSortChange = useCallback((sortOption: SortOption) => {
    setSelectedSort(sortOption);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 필터링된 프로젝트 데이터
  const filteredProjects = useMemo(() => {
    return openSourceData?.projects || [];
  }, [openSourceData]);

  return {
    openSourceData,
    isLoading,
    error,
    filteredProjects,
    selectedCategory,
    selectedSort,
    handleCategoryChange,
    handleSortChange,
    handleSearch,
    refreshData: loadOpenSourceData,
  };
}
