import { getDomainDisplayName } from "@/shared/lib/utils/domainMapping";
import { projectDetailAtom } from "@/shared/model/atoms/projectDetail.atoms";
import { useAtomValue } from "jotai";

export default function ProjectDetailHeader() {
  const projectDetail = useAtomValue(projectDetailAtom);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{projectDetail.title}</h1>
          <div className="flex space-x-4 text-sm text-gray-600 mt-1">
            <span>
              타입:{" "}
              {projectDetail.category === "CLASSIFICATION" ? "분류" : "회귀"}
            </span>
            <span>도메인: {getDomainDisplayName(projectDetail.domain)}</span>
            <span>버전: {projectDetail.version}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          {projectDetail.ownerYn && (
            <>
              <button>버전 삭제</button>
              <button>비공개로 전환</button>
            </>
          )}
          <button>재학습</button>
        </div>
      </div>
    </div>
  );
}
