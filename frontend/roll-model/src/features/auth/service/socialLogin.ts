export const socialLogin = (provider: "google" | "github") => {
	if (typeof window !== "undefined") {
		window.location.href = `/api/oauth2/authorization/${provider}`;
	} else {
		throw new Error("OAuth 로그인은 클라이언트 환경에서만 가능합니다.");
	}
};
