import { getDomainDisplayName } from "@/shared/lib/utils/domainMapping";
import { OpenSourceProject } from "../model/types";

interface ProjectCardProps {
  project: OpenSourceProject;
}

export const ProjectCardForOpenSource = ({ project }: ProjectCardProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-lg font-bold truncate">{project.title}</h2>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        <p>타입: {project.category === "CLASSIFICATION" ? "분류" : "회귀"}</p>
        <p>
          도메인:{" "}
          {project.displayDomain || getDomainDisplayName(project.domain)}
        </p>
        <p>목표변수: {project.target}</p>
        <p>데이터 수: {project.dataCount.toLocaleString()}</p>
        <p>버전 : {project.version}</p>
        <p>학습시간 : {project.runnungDuration}</p>
        <p>주인장번호 : {project.writerId}</p>
        <p>주인장이름 : {project.writerNickname}</p>
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
