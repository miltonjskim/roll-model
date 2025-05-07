import { ProjectType } from '@/entities/open-source/model/types';
import { SortOption } from '@/app/open-source/model/useOpenSource';

interface CategoryTabsProps {
  selectedCategory: 'all' | ProjectType;
  selectedSort: SortOption;
  onCategoryChange: (category: 'all' | ProjectType) => void;
  onSortChange: (sort: SortOption) => void;
}

export const CategoryTabsForOpenSource = ({ selectedCategory, selectedSort, onCategoryChange, onSortChange }: CategoryTabsProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      {/* 카테고리 탭 */}
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

      {/* 정렬 탭 - 변경된 부분: "인기" -> "이름순" */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${selectedSort === 'recent' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => onSortChange('recent')}
        >
          최신
        </button>
        <button
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${selectedSort === 'name' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => onSortChange('name')}
        >
          이름순
        </button>
      </div>
    </div>
  );
};
