"use client";

import { useEffect, useState } from "react";
import {
  DashboardData,
  DashboardResponse,
} from "@/entities/project/model/types";

// 임시로 목업 데이터 직접 불러오기
import dashboardMock from "@/shared/api/mocks/dashboard.json";
import { StatsGrid } from "@/widgets/dashboardStats/ui/statsGrid";
import { ProjectGrid } from "@/widgets/projectGrid/ui/projectGrid";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 목업 데이터 로드 (실제 API 연동 전까지 사용)
    const mockData = dashboardMock as DashboardResponse;
    setDashboardData(mockData.data);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>;
  }

  if (!dashboardData) {
    return <div className="p-8">데이터를 불러오는데 실패했습니다.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>

      {/* 통계 요약 섹션 - 컴포넌트로 분리 */}
      <StatsGrid summary={dashboardData.summary} />

      {/* 프로젝트 검색 및 필터 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="mb-4 md:mb-0">
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded">
              전체
            </button>
            <button className="px-4 py-2 bg-gray-200 rounded">분류</button>
            <button className="px-4 py-2 bg-gray-200 rounded">회귀</button>
          </div>
        </div>
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="프로젝트 검색..."
            className="w-full px-4 py-2 border rounded"
          />
        </div>
      </div>

      {/* 프로젝트 그리드 */}
      <ProjectGrid projects={dashboardData.projects} />
    </div>
  );
}
