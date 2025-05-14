import { useState } from 'react';
import { OpenSourceProject } from '@/entities/open-source/model/types';
import { useAfterSchool } from '@/features/project-detail/useAfterSchool';
import { Project } from '@/entities/dashboard/model/types';

interface AfterSchoolDropdownProps {
  project: OpenSourceProject | Project;
}

export const AfterSchoolDropdown = ({ project }: AfterSchoolDropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { handleAfterSchoolClick, moveToPreprocessing } = useAfterSchool();

  return (
    <div className="relative">
      {project.status === 'COMPLETED' && (
        <button
          className="bg-[theme(primary-black)] hover:bg-[theme(color-gray-01)] w-20 cursor-pointer rounded-md px-3 py-2 text-white duration-600 ease-out"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          재학습
        </button>
      )}
      {showDropdown && (
        <div
          className="absolute right-0 bottom-full mt-1 flex flex-col gap-1 rounded-md border border-gray-200 bg-white p-1 shadow-md"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <button
            className="bg-[theme(color-blue-02)] hover:bg-[theme(color-blue-01)] rounded-md px-3 py-2 text-sm whitespace-nowrap text-white"
            onClick={() => moveToPreprocessing(project.id, project.title)}
          >
            전처리부터 재학습
          </button>
          <button className="bg-[theme(color-green-02)] hover:bg-[theme(color-green-01)] rounded-md px-3 py-2 text-sm whitespace-nowrap text-white" onClick={() => handleAfterSchoolClick(project.id)}>
            모델링부터 재학습
          </button>
        </div>
      )}
    </div>
  );
};
