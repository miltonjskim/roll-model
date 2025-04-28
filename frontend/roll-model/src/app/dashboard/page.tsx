"use client";

import { useEffect, useState } from "react";
import { DashboardData, DashboardResponse } from "@/entities/project/model/types";
import { StatsGrid } from "@/widgets/dashboardStats/ui/StatsGrid";

// 임시로 목업 데이터 직접 불러오기
import dashboardMock from "@/shared/api/mocks/dashboard.json";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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
            <button className="px-4 py-2 bg-blue-600 text-white rounded">전체</button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardData.projects.map((project) => (
          <div key={project.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-bold">{project.title}</h2>
              <span className={`text-xs px-2 py-1 rounded ${
                project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {project.status === 'completed' ? '완료' : '진행 중'}
              </span>
            </div>
            
            <div className="text-sm text-gray-500 mb-4">
              <p>타입: {project.type === 'classification' ? '분류' : '회귀'}</p>
              <p>도메인: {project.domain}</p>
              <p>목표변수: {project.target}</p>
              <p>데이터 수: {project.dataCount.toLocaleString()}</p>
              {project.accuracy && <p>정확도: {project.accuracy}%</p>}
            </div>
            
            <div className="flex justify-between text-sm">
              <span>❤️ {project.likeCount}</span>
              <span>⬇️ {project.downloadCount}</span>
              <span>🔍 {project.visibility ? '공개' : '비공개'}</span>
              <span>⏱️ {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}