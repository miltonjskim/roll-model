export default function ProjectDetailLoading() {
  // 'use client' 지시문 제거 (서버 컴포넌트로 만들기)
  return (
    <div className="space-y-6">
      <ProjectDetailSkeletonCard />
      <ProjectDetailSkeletonCard />
      <ProjectDetailSkeletonCard />
      <ProjectDetailSkeletonCard />
      <ProjectDetailSkeletonCard />
    </div>
  );
}

function ProjectDetailSkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--color-gray-03)] p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="mb-4 h-16 w-full animate-pulse rounded bg-gray-200"></div>
        <div className="mb-4 h-16 w-24 animate-pulse rounded bg-gray-200"></div>
      </div>
      <div className="w-full animate-pulse space-y-3 rounded bg-gray-200 p-4">
        <div className="h-8 w-1/6 animate-pulse rounded bg-gray-100"></div>
        <div className="h-6 w-1/4 animate-pulse rounded bg-gray-100"></div>
        <div className="h-20 w-5/6 animate-pulse rounded bg-gray-100"></div>
      </div>
    </div>
  );
}
