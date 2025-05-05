"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/react-query/queryClient";
import { Provider as JotaiProvider } from "jotai";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { InitAuthProvider } from "@/features/auth/init/InitAuthProvider";

export function AppProvider({ children }: { children: React.ReactNode }) {
	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>
        <InitAuthProvider />  {/* 로그인 상태 초기화 */}
				{children}
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</JotaiProvider>
	);
}
