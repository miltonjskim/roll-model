import { useState } from 'react';
import { OpenSourceProject } from '@/entities/open-source/model/types';
import { useAfterSchool } from '@/features/project-detail/useAfterSchool';
import { Project } from '@/entities/dashboard/model/types';

interface MinimalProject {
  id: string;
  title: string;
  status: string;
}

interface AfterSchoolDropdownProps {
  project: OpenSourceProject | Project | MinimalProject;
}

export const AfterSchoolDropdown = ({ project }: AfterSchoolDropdownProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { handleAfterSchoolClick, moveToPreprocessing } = useAfterSchool();

  return (
    <div className="relative">
      {project.status === 'COMPLETED' && (
        <button
          className="bg-[theme(primary-black)] hover:bg-[theme(color-gray-01)] w-20 cursor-pointer rounded-md px-3 py-2 text-white duration-600 ease-out"
          onClick={(e) => {
            e.stopPropagation(); // 이벤트 버블링 중단
            setIsVisible(true);
          }}
        >
          재학습
        </button>
      )}

      {/* 모달 오버레이 */}
      {isVisible && (
        <div
          className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-white/50"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
        >
          {/* 모달 내용 */}
          <div className="relative rounded-lg bg-white p-6 shadow-xl">
            {/* X 버튼 */}
            <button
              className="absolute top-4 right-4 cursor-pointer text-gray-300 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
            >
              ✕
            </button>

            <h3 className="text-[theme(primary-black)] mb-4 text-lg font-medium">재학습 옵션 선택</h3>

            <div className="flex gap-6">
              <button
                className="bg-[theme(primary-black)] hover:bg-[theme(primary-black)]/90 tranition-all cursor-pointer rounded-md px-20 py-36 text-sm whitespace-nowrap text-white duration-300 ease-in-out select-none"
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 버블링 중단
                  moveToPreprocessing(project.id, project.title);
                  setIsVisible(false);
                }}
              >
                전처리부터 재학습
              </button>
              <button
                className="bg-[theme(primary-black)] hover:bg-[theme(primary-black)]/90 tranition-all cursor-pointer rounded-md px-20 py-36 text-sm whitespace-nowrap text-white duration-300 ease-in-out select-none"
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 버블링 중단
                  handleAfterSchoolClick(project.id);
                  setIsVisible(false);
                }}
              >
                모델링부터 재학습
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
