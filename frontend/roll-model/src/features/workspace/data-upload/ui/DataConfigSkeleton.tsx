'use client';

import { Skeleton } from '@/components/ui/skeleton';

const DataConfigSkeleton = () => {
  return (
    <div className="flex flex-col justify-center">
      <div className="flex items-center justify-between px-28">
        <div className="space-y-2 text-left">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="mx-auto mt-8 mb-4 flex max-w-[90%] items-stretch justify-center gap-4">
        {/* 좌측 */}
        <div className="flex max-w-[90%] basis-[60rem] flex-col gap-4">
          {/* 데이터 구조 */}
          <div className="bg-[theme(primary-white)] flex-1 space-y-4 rounded-md p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-80" />

            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-64" />

            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-64" />

            <div className="mt-4 flex justify-end">
              <Skeleton className="h-5 w-48" />
            </div>

            <div className="mt-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-md" />
              ))}
            </div>
          </div>

          {/* 컬럼별 타입 지정 */}
          <div className="bg-[theme(primary-white)] flex-1 space-y-4 rounded-md p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>

            <div className="flex flex-wrap gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-[180px]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 */}
        <div className="flex basis-[24rem] flex-col justify-between">
          <div className="bg-[theme(primary-white)] flex-1 space-y-6 rounded-md p-6">
            {/* 구분자 */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* 인코딩 */}
            <div className="mt-6 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* 버튼 */}
          <div className="space-y-2 pt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataConfigSkeleton;
