import { Project } from "@/entities/project/model/types";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-lg font-bold truncate">{project.title}</h2>
        <span
          className={`text-xs px-2 py-1 rounded ${
            project.status === "completed"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {project.status === "completed" ? "완료" : "진행 중"}
        </span>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        <p>타입: {project.type === "classification" ? "분류" : "회귀"}</p>
        <p>도메인: {project.domain}</p>
        <p>목표변수: {project.target}</p>
        <p>데이터 수: {project.dataCount.toLocaleString()}</p>
        {project.accuracy && <p>정확도: {project.accuracy}%</p>}
        {project.rmse && <p>RMSE: {project.rmse}</p>}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span className="flex items-center">
          <span className="mr-1">❤️</span> {project.likeCount}
        </span>
        <span className="flex items-center">
          <span className="mr-1">⬇️</span> {project.downloadCount}
        </span>
        <span className="flex items-center">
          <span className="mr-1">{project.visibility ? "🌐" : "🔒"}</span>
          {project.visibility ? "공개" : "비공개"}
        </span>
        <span className="flex items-center">
          <span className="mr-1">⏱️</span>
          {new Date(project.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};