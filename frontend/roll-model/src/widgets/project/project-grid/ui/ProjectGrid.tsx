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
    <div className="flex flex-wrap justify-center">
      {projects.map((project) => (
        <div key={project.id} className="w-[24rem] p-4">
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
};
