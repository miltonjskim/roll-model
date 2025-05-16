import { useEffect, useMemo, useState, useCallback } from 'react';
import { DashboardData, Project, ProjectType } from '@/entities/dashboard/model/types';
import { fetchDashboardData } from '@/shared/api/dashboardApi';

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'COMPLETED' | 'PREPROCESSED' | 'FAILED_OR_LEARNING'>('all');

  // 필터링 및 검색 상태
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProjectType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 초기 데이터 로드 useCallback 쓰는게 트렌디하다는데... 우선 ㅇㅋ
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchDashboardData();
      console.log('대시보드 가져오기');

      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드 및 이벤트 리스너 설정
  useEffect(() => {
    // 초기 데이터 로드
    loadDashboardData();

    // FCM 메시지로 인한 modelStatusUpdate 이벤트 리스너 추가
    const handleModelStatusUpdate = () => {
      console.log('Dashboard: 모델 상태 업데이트 감지, 데이터 새로고침');
      loadDashboardData();
    };

    // 이벤트 리스너 등록
    window.addEventListener('modelStatusUpdate', handleModelStatusUpdate);

    // localStorage 변경 감지 (다른 탭/창에서 업데이트 된 경우)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'modelTrainingStatus') {
        console.log('Dashboard: 다른 탭에서 모델 상태 변경 감지, 데이터 새로고침');
        loadDashboardData();
      }
    };

    // storage 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('modelStatusUpdate', handleModelStatusUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadDashboardData]);

  // 카테고리 핸들러
  const handleCategoryChange = useCallback((category: 'all' | ProjectType) => {
    setSelectedCategory(category);
  }, []);

  // 검색 핸들러
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // statuats 핸들러
  const handleStatusChange = useCallback((status: 'all' | 'COMPLETED' | 'PREPROCESSED' | 'FAILED_OR_LEARNING') => {
    setSelectedStatus((prev) => (prev === status ? 'all' : status));
    // setSelectedStatus(status);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!dashboardData?.projects) return [];

    return (
      dashboardData.projects
        // 카테고리 필터링
        .filter((project) => selectedCategory === 'all' || project.category === selectedCategory)
        // status 필터링
        .filter((project) => {
          if (selectedStatus === 'all') return true;
          if (selectedStatus === 'COMPLETED') return project.status === 'COMPLETED';
          if (selectedStatus === 'PREPROCESSED') return project.status === 'PREPROCESSED';
          if (selectedStatus === 'FAILED_OR_LEARNING') return project.status === 'FAILED' || project.status === 'LEARNING';
          return true;
        })
        // 검색어 필터링
        .filter((project) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase().trim();
          return project.title.toLowerCase().includes(query) || (project.target?.toLowerCase() || '').includes(query);
        })
    );
  }, [dashboardData?.projects, selectedCategory, selectedStatus, searchQuery]);

  return {
    dashboardData,
    isLoading,
    error,
    filteredProjects,
    selectedCategory,
    selectedStatus,
    handleStatusChange,
    handleCategoryChange,
    handleSearch,
    refreshData: loadDashboardData,
  };
}
