import Link from "next/link";

interface NewProjectButtonProps {
  className?: string;
}

export const NewProjectButton = ({ className = "" }: NewProjectButtonProps) => {
  return (
    <Link
      href="/workspace/new/tempurltempurltempurltempurl"
      className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${className}`}
    >
      <span className="mr-2">+</span>
      <span>새 프로젝트</span>
    </Link>
  );
};