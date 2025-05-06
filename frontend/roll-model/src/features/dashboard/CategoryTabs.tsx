import { ProjectType } from '@/entities/dashboard/model/types';

interface CategoryTabsProps {
  selectedCategory: 'all' | ProjectType;
  onCategoryChange: (category: 'all' | ProjectType) => void;
}

export const CategoryTabs = ({ selectedCategory, onCategoryChange }: CategoryTabsProps) => {
  return (
    <div className="flex space-x-2">
      <button
        className={`cursor-pointer rounded-md px-4 py-2 text-lg select-none ${selectedCategory === 'all' ? 'text-[theme(primary-black)] font-semibold' : 'text-[theme(color-gray-02)]'}`}
        onClick={() => onCategoryChange('all')}
      >
        전체
      </button>
      <button
        className={`cursor-pointer rounded-md px-4 py-2 text-lg select-none ${selectedCategory === 'CLASSIFICATION' ? 'text-[theme(primary-black)] font-semibold' : 'text-[theme(color-gray-02)]'}`}
        onClick={() => onCategoryChange('CLASSIFICATION')}
      >
        분류
      </button>
      <button
        className={`cursor-pointer rounded-md px-4 py-2 text-lg select-none ${selectedCategory === 'REGRESSION' ? 'text-[theme(primary-black)] font-semibold' : 'text-[theme(color-gray-02)]'}`}
        onClick={() => onCategoryChange('REGRESSION')}
      >
        회귀
      </button>
    </div>
  );
};
