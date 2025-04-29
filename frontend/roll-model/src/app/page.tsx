import { SocialLoginButtons } from "@/features/auth/ui/SocialLoginButtons";
import Image from "next/image";

export default function Home() {
	return (
		<div className="">
			{/* TODO: 테스트용으로 잠깐 둠 추후 수정 */}
			<SocialLoginButtons />
		</div>
	);
}
