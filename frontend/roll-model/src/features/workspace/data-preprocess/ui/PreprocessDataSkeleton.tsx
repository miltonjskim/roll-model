'use client';

import { Skeleton } from '@/components/ui/skeleton';

const PreprocessDataSkeleton = () => {
  return (
    <div className="mx-auto w-full overflow-y-auto px-4 pb-4">
      {/* 상단 제목 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2 text-left">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      {/* 콘텐츠 영역 */}
      <div className="mt-6 flex h-[calc(100%-4.5rem)] flex-col gap-2 xl:flex-row xl:gap-2">
        {/* 좌측 영역 */}
        <div className="flex max-h-full min-h-0 flex-col xl:max-w-[20rem] xl:min-w-[16rem] xl:basis-[20%]">
          {/* 프로젝트 정보 */}
          <div className="mb-2 rounded-lg bg-white p-4">
            <Skeleton className="h-5 w-36" />
          </div>

          {/* 전처리 기능 */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white p-4">
            <Skeleton className="mb-4 h-5 w-28" />
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
            <Skeleton className="mt-6 h-4 w-40" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>

        {/* 우측 영역 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {/* 추천 단계 + 데이터 미리보기 */}
            <div className="flex min-h-0 flex-[5] flex-col gap-2 md:flex-row">
              {/* 추천 */}
              <div className="min-h-0 flex-[1] rounded-md bg-white p-4 pb-0 md:w-1/4">
                <Skeleton className="mb-4 h-5 w-40" />
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="mb-2 h-14 w-full rounded-md" />
                ))}
              </div>

              {/* 미리보기 */}
              <div className="min-h-0 flex-[3] rounded-md bg-white p-4">
                <Skeleton className="mb-2 h-5 w-40" />
                <Skeleton className="mb-4 h-4 w-64" />
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="mb-2 h-8 w-full rounded-sm" />
                ))}
              </div>
            </div>

            {/* 적용한 단계 */}
            <div className="flex-[2] overflow-y-auto rounded-md bg-white p-4">
              <Skeleton className="mb-1 h-5 w-36" />
              <Skeleton className="mb-4 h-4 w-52" />
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="mb-2 h-16 w-full rounded-md" />
              ))}
            </div>
          </div>

          {/* 완료 버튼 */}
          <div className="complete-button mt-2">
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreprocessDataSkeleton;
