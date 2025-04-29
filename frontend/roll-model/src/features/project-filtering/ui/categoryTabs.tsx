import { ProjectType } from "@/entities/project/model/types";

interface CategoryTabsProps {
  selectedCategory: "all" | ProjectType;
  onCategoryChange: (category: "all" | ProjectType) => void;
}

export const CategoryTabs = ({
  selectedCategory,
  onCategoryChange,
}: CategoryTabsProps) => {
  return (
    <div className="flex space-x-2">
      <button
        className={`px-4 py-2 rounded transition-colors ${
          selectedCategory === "all"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
        }`}
        onClick={() => onCategoryChange("all")}
      >
        전체
      </button>
      <button
        className={`px-4 py-2 rounded transition-colors ${
          selectedCategory === "CLASSIFICATION"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
        }`}
        onClick={() => onCategoryChange("CLASSIFICATION")}
      >
        분류
      </button>
      <button
        className={`px-4 py-2 rounded transition-colors ${
          selectedCategory === "REGRESSION"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
        }`}
        onClick={() => onCategoryChange("REGRESSION")}
      >
        회귀
      </button>
    </div>
  );
};