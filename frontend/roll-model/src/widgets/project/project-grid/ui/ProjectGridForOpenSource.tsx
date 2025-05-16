import { OpenSourceProject } from '@/entities/open-source/model/types';
import { ProjectCardForOpenSource } from '@/entities/open-source/ui/ProjectCardForOpenSource';

interface ProjectGridProps {
  projects: OpenSourceProject[];
}

export const ProjectGridForOpenSource = ({ projects }: ProjectGridProps) => {
  if (projects.length === 0) {
    return <div className="py-10 text-center">프로젝트가 없습니다.</div>;
  }

  return (
    <div className="flex flex-wrap justify-center">
      {projects.map((project) => (
        <div key={project.id} className="w-[24rem] p-4">
          <ProjectCardForOpenSource project={project} />
        </div>
      ))}
    </div>
  );
};
