import Link from 'next/link';

interface NewProjectButtonProps {
  className?: string;
}

export const NewProjectButton = ({ className = '' }: NewProjectButtonProps) => {
  return (
    <Link
      href="/workspace/new/tempurltempurltempurltempurl"
      className={`bg-[theme(primary-black)] hover:bg-[theme(color-gray-01)] inline-flex items-center rounded px-4 py-2 text-white transition-colors duration-600 ease-out ${className}`}
    >
      <span className="mr-2">+</span>
      <span>새 프로젝트</span>
    </Link>
  );
};
