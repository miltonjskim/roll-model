"use client";

import { useSetAtom } from "jotai";
import { accessTokenAtom, refreshTokenAtom } from "../model/authAtoms";
import { socialLogin } from "../service/socialLogin";
import { Button } from "@/components/ui/button";

export const SocialLoginButtons = () => {
	const setAccessToken = useSetAtom(accessTokenAtom);
	const setRefreshToken = useSetAtom(refreshTokenAtom);

	const handleLogin = async (provider: "google" | "github") => {
		try {
			const { accessToken, refreshToken } = await socialLogin(provider);

			console.log("accessToken:", accessToken);
			console.log("refreshToken:", refreshToken);

			if (accessToken && refreshToken) {
				setAccessToken(accessToken);
				setRefreshToken(refreshToken);
				alert("로그인 성공!");
			} else {
				throw new Error("토큰 파싱 실패");
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error("로그인 에러:", error.message);
				alert(error.message);
			} else {
				console.error("알 수 없는 에러:", error);
				alert("알 수 없는 에러가 발생했습니다.");
			}
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<Button
				variant="black"
				onClick={() => handleLogin("google")}>
				구글로 로그인
			</Button>
			<Button
				variant="black"
				onClick={() => handleLogin("github")}>
				깃허브로 로그인
			</Button>
		</div>
	);
};
