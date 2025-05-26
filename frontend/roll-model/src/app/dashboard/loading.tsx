export default function DashboardLoading() {
  return (
    <div className="container mx-auto w-[80vw] py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-5xl font-bold tracking-tighter">Dashboard</h1>
        <div className={`h-[2.5rem] w-[8rem] animate-pulse items-center rounded bg-gray-200`}></div>
      </div>

      {/* 통계 요약 섹션 */}
      <div className="mb-8 flex h-32 w-full animate-pulse gap-4 rounded-xl bg-gray-200 p-4">
        <div className="h-full w-1/4 animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-1/4 animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-1/4 animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-1/4 animate-pulse rounded bg-gray-300"></div>
      </div>

      {/* 프로젝트 검색 및 필터 */}
      <div className="mb-8 flex h-16 w-full animate-pulse gap-4 rounded-xl bg-gray-200 p-3">{/* <div className="bg-gray-100 h-full w-16 animate-pulse rounded"></div> */}</div>

      {/* 프로젝트 그리드 */}

      <div className="mb-8 flex h-[16rem] w-full animate-pulse justify-center gap-8 rounded-xl bg-gray-200 p-4">
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
      </div>
      <div className="mb-8 flex h-[16rem] w-full animate-pulse justify-center gap-8 rounded-xl bg-gray-200 p-4">
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
      </div>
      <div className="mb-8 flex h-[16rem] w-full animate-pulse justify-center gap-8 rounded-xl bg-gray-200 p-4">
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
        <div className="h-full w-[24rem] animate-pulse rounded bg-gray-300"></div>
      </div>
    </div>
  );
}

export function DashboardSkeletonCard() {
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
