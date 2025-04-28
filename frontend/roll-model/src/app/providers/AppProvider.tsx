"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/react-query/queryClient";
import { Provider as JotaiProvider } from "jotai";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function AppProvider({ children }: { children: React.ReactNode }) {
	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>
				{children}
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</JotaiProvider>
	);
}
