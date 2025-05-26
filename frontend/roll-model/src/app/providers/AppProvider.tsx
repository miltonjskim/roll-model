'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/react-query/queryClient';
import { Provider as JotaiProvider } from 'jotai';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { InitAuthProvider } from '@/features/auth/init/InitAuthProvider';
import { ReactQueryGlobalLoadingSync } from '@/shared/lib/react-query/ReactQueryGlobalLoadingSync';
import { RouteChangeLoader } from '@/shared/ui/RouteChangeLoader';
import GlobalLoading from '@/shared/ui/GlobalLoading';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <InitAuthProvider /> {/* 로그인 상태 초기화 */}
        <ReactQueryGlobalLoadingSync /> {/* 전역 로딩 동기화 */}
        <RouteChangeLoader /> {/* route 바뀔 때 로더 */}
        <GlobalLoading />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </JotaiProvider>
  );
}
