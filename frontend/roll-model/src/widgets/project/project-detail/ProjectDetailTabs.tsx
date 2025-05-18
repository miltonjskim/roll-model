import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useAtomValue } from 'jotai';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function ProjectDetailTabs() {
  const projectDetail = useAtomValue(projectDetailAtom);
  const pathname = usePathname();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const basePath = `/project-detail/${projectDetail.id}`;
  // const isActive = (path: string) => pathname === path;

  const tabs = [
    { name: '개요', path: basePath },
    { name: '데이터', path: `${basePath}/data-section` },
    { name: '모델 및 평가', path: `${basePath}/modeling-section` },
    // { name: '테스트', path: `${basePath}/testing-section` },
    { name: '버전', path: `${basePath}/version-section` },
    { name: 'API', path: `${basePath}/api-section` },
  ];

  const getButtonClass = (path: string) => {
    // 호버 중인 경우 - 현재 호버 중인 버튼만 primary-black
    if (hoveredCategory !== null) {
      if (hoveredCategory === path) {
        return 'text-[theme(primary-black)] font-semibold';
      } else {
        return 'text-[theme(color-gray-02)] ';
      }
    }
    // 호버 중이 아닌 경우 - 선택된 버튼만 primary-black
    return pathname === path ? 'text-[theme(primary-black)] font-semibold' : 'text-[theme(color-gray-02)]';
  };

  return (
    <div className="bg-[theme(primary-white)] mb-4 flex flex-col items-start justify-between rounded-md px-2 py-2 shadow-md md:flex-row md:items-center">
      <nav className="flex space-x-6">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`md:text-md cursor-pointer rounded-md py-2 text-sm transition-colors select-none md:px-4 lg:text-lg ${getButtonClass(tab.path)}`}
            onMouseEnter={() => setHoveredCategory(tab.path)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
