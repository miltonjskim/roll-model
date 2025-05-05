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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
