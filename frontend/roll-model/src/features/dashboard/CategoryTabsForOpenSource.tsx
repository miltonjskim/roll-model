import { ProjectType } from "@/entities/open-source/model/types";
import { SortOption } from "@/app/open-source/model/useOpenSource";
import React from "react";

interface CategoryTabsProps {
  selectedCategory: "all" | ProjectType;
  selectedSort: SortOption;
  onCategoryChange: (category: "all" | ProjectType) => void;
  onSortChange: (sort: SortOption) => void;
}

export const CategoryTabsForOpenSource = ({
  selectedCategory,
  selectedSort,
  onCategoryChange,
  onSortChange,
}: CategoryTabsProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* 카테고리 탭 */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => onCategoryChange("all")}
        >
          전체
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedCategory === "CLASSIFICATION"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => onCategoryChange("CLASSIFICATION")}
        >
          분류
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedCategory === "REGRESSION"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => onCategoryChange("REGRESSION")}
        >
          회귀
        </button>
      </div>

      {/* 정렬 탭 */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedSort === "recent"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => onSortChange("recent")}
        >
          최신
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedSort === "popular"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => onSortChange("popular")}
        >
          인기
        </button>
      </div>
    </div>
  );
};
