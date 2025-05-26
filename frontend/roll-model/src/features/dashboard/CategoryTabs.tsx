import { ProjectType } from '@/entities/dashboard/model/types';
import { useState } from 'react';

interface CategoryTabsProps {
  selectedCategory: 'all' | ProjectType;
  onCategoryChange: (category: 'all' | ProjectType) => void;
}

export const CategoryTabs = ({ selectedCategory, onCategoryChange }: CategoryTabsProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const getButtonClass = (category: 'all' | ProjectType) => {
    // 호버 중인 경우 - 현재 호버 중인 버튼만 primary-black
    if (hoveredCategory !== null) {
      if (hoveredCategory === category) {
        return 'text-[theme(primary-black)] font-semibold';
      } else {
        return 'text-[theme(color-gray-02)] ';
      }
    }
    // 호버 중이 아닌 경우 - 선택된 버튼만 primary-black
    return category === selectedCategory ? 'text-[theme(primary-black)] font-semibold' : 'text-[theme(color-gray-02)]';
  };

  return (
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
  );
};
