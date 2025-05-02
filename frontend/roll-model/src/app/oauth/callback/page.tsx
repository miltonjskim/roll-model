"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { accessTokenAtom, refreshTokenAtom } from "@/features/auth/model/authAtoms";

const CallbackPage = () => {
	const router = useRouter();
	const setAccessToken = useSetAtom(accessTokenAtom);
	const setRefreshToken = useSetAtom(refreshTokenAtom);

	useEffect(() => {
		const cookieHeader = document.cookie.split("; ").find((row) => row.startsWith("tokens="));

		if (!cookieHeader) {
			alert("토큰이 존재하지 않습니다.");
			router.push("/");
			return;
		}

		const tokens = decodeURIComponent(cookieHeader.split("=")[1]);
		const params = new URLSearchParams(tokens);

		const accessToken = params.get("accessToken");
		const refreshToken = params.get("refreshToken");

		if (accessToken && refreshToken) {
			setAccessToken(accessToken);
			setRefreshToken(refreshToken);
			router.push("/");
		} else {
			alert("토큰 파싱에 실패했습니다.");
			router.push("/");
		}
	}, [router, setAccessToken, setRefreshToken]);

	return <div className="text-center py-10 text-xl">로그인 중입니다...</div>;
};

export default CallbackPage;
