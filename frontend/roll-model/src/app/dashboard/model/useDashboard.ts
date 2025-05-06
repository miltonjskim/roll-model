import { useEffect, useMemo, useState, useCallback } from 'react';
import { DashboardData, Project, ProjectType } from '@/entities/dashboard/model/types';
import { fetchDashboardData } from '@/shared/api/dashboardApi';

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 필터링 및 검색 상태
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProjectType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 초기 데이터 로드 useCallback 쓰는게 트렌디하다는데... 우선 ㅇㅋ
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchDashboardData();
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCategoryChange = useCallback((category: 'all' | ProjectType) => {
    setSelectedCategory(category);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!dashboardData?.projects) return [];

    return (
      dashboardData.projects
        // 카테고리 필터링
        .filter((project) => selectedCategory === 'all' || project.category === selectedCategory)
        // 검색어 필터링
        .filter((project) => {
          if (!searchQuery.trim()) return true;

          const query = searchQuery.toLowerCase().trim();
          return project.title.toLowerCase().includes(query) || (project.target?.toLowerCase() || '').includes(query);
        })
    );
  }, [dashboardData?.projects, selectedCategory, searchQuery]);

  return {
    dashboardData,
    isLoading,
    error,
    filteredProjects,
    selectedCategory,
    handleCategoryChange,
    handleSearch,
    refreshData: loadDashboardData,
  };
}
