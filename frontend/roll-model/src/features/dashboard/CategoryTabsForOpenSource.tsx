import { ProjectType } from '@/entities/open-source/model/types';
import { SortOption } from '@/app/open-source/model/useOpenSource';
import { useState } from 'react';

interface CategoryTabsProps {
  selectedCategory: 'all' | ProjectType;
  selectedSort: SortOption;
  onCategoryChange: (category: 'all' | ProjectType) => void;
  onSortChange: (sort: SortOption) => void;
}

export const CategoryTabsForOpenSource = ({ selectedCategory, selectedSort, onCategoryChange, onSortChange }: CategoryTabsProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const getButtonClass = (category: 'all' | ProjectType) => {
    // 호버 중인 경우 - 현재 호버 중인 버튼만 primary-black
    if (hoveredCategory !== null) {
      if (hoveredCategory === category) {
        return 'text-[theme(primary-black)]  font-semibold';
      } else {
        return 'text-[theme(color-gray-02)]';
      }
    }
    // 호버 중이 아닌 경우 - 선택된 버튼만 primary-black
    return category === selectedCategory ? 'text-[theme(primary-black)] font-semibold' : 'text-[theme(color-gray-02)]';
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* 카테고리 탭 */}
      <div className="flex space-x-2">
        <button
          className={`cursor-pointer rounded-md px-4 py-2 text-lg transition-colors select-none ${getButtonClass('all')}`}
          onClick={() => onCategoryChange('all')}
          onMouseEnter={() => setHoveredCategory('all')}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          전체
        </button>
        <button
          className={`cursor-pointer rounded-md px-4 py-2 text-lg transition-colors select-none ${getButtonClass('CLASSIFICATION')}`}
          onClick={() => onCategoryChange('CLASSIFICATION')}
          onMouseEnter={() => setHoveredCategory('CLASSIFICATION')}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          분류
        </button>
        <button
          className={`cursor-pointer rounded-md px-4 py-2 text-lg transition-colors select-none ${getButtonClass('REGRESSION')}`}
          onClick={() => onCategoryChange('REGRESSION')}
          onMouseEnter={() => setHoveredCategory('REGRESSION')}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          회귀
        </button>
      </div>

      {/* 정렬 탭 - 변경된 부분: "인기" -> "이름순" */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-all ${selectedSort === 'recent' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => onSortChange('recent')}
        >
          최신
        </button>
        <button
          className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-all ${selectedSort === 'name' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => onSortChange('name')}
        >
          이름순
        </button>
      </div>
    </div>
  );
};
