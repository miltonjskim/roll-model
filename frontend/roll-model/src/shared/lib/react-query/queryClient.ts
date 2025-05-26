import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 3, // 실패했을 때 재시도 3회
			refetchOnWindowFocus: false, // 포커스할 때 재요청 X
		},
	},
});
