import { Project } from '@/entities/dashboard/model/types';
import { ProjectCard } from '@/entities/dashboard/ui/ProjectCard';
interface ProjectGridProps {
  projects: Project[];
}

export const ProjectGrid = ({ projects }: ProjectGridProps) => {
  if (projects.length === 0) {
    return <div className="py-10 text-center">프로젝트가 없습니다.</div>;
  }

  return (
    <div className="flex justify-center ">
      <div className="grid grid-cols-1 gap-8  md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="w-full max-w-[22rem] min-w-[312px]">
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </div>
  );
};
