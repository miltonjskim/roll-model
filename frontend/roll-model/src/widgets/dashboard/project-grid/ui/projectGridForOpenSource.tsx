import { OpenSourceProject } from "@/entities/open-source/model/types";
import { ProjectCardForOpenSource } from "@/entities/open-source/ui/projectCardForOpenSource";

interface ProjectGridProps {
  projects: OpenSourceProject[];
}

export const ProjectGridForOpenSource = ({ projects }: ProjectGridProps) => {
  if (projects.length === 0) {
    return <div className="text-center py-10">프로젝트가 없습니다.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCardForOpenSource key={project.id} project={project} />
      ))}
    </div>
  );
};
