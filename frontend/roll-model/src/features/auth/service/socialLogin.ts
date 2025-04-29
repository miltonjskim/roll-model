import { axiosInstance } from "@/shared/lib/axios/axiosInstance";

export const socialLogin = async (provider: "google" | "github") => {
	try {
		const response = await axiosInstance.get(`/api/oauth2/authorization/${provider}`, {
			withCredentials: true,
		});

		console.log("response:", response);

		const cookieHeader = typeof document !== "undefined" ? document.cookie.split("; ").find((row) => row.startsWith("tokens=")) : null;

		if (!cookieHeader) {
			throw new Error("토큰 정보를 찾을 수 없습니다.");
		}

		console.log("cookieHeader:", cookieHeader);

		const tokens = decodeURIComponent(cookieHeader.split("=")[1]);
		const params = new URLSearchParams(tokens);

		console.log("tokens:", tokens);

		return {
			accessToken: params.get("accessToken"),
			refreshToken: params.get("refreshToken"),
		};
	} catch (error) {
		throw error; // 인터셉터는 처리됐지만, 로직상 실패로 인식해야 해서 throw 유지
	}
};
