import { projectDetailAtom } from "@/shared/model/atoms/projectDetail.atoms";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProjectDetailTabs() {
  const projectDetail = useAtomValue(projectDetailAtom);
  const pathname = usePathname();

  const basePath = `/project-detail/${projectDetail.id}`;
  const isActive = (path: string) => pathname === path;

  const tabs = [
    { name: "개요", path: basePath },
    { name: "데이터", path: `${basePath}/data-section` },
    { name: "모델 및 평가", path: `${basePath}/modeling-section` },
    { name: "테스트", path: `${basePath}/testing-section` },
    { name: "버전", path: `${basePath}/version-section` },
    { name: "API", path: `${basePath}/api-section` },
  ];

  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              isActive(tab.path)
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
