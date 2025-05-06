"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const Workspace = () => {
	const router = useRouter();

	const handleCreateProject = () => {
		router.push("/workspace/project-meta");
	};

	const handleRelearnProject = () => {
		// TODO: 내 프로젝트 재학습 목록이 뜨게.. 렌더링 방식은 아직 생각 못함
	};
	return (
		<div>
			<div>
				<h1>시작하기</h1>
				<h2>시작할 프로젝트를 선택하세요.</h2>
			</div>
			<div>
				<Button
					variant="black"
					onClick={handleCreateProject}>
					+ 새로운 프로젝트 만들기
				</Button>
				<Button
					variant="outline"
					onClick={handleRelearnProject}>
					최근 프로젝트에서 재학습
				</Button>
			</div>
		</div>
	);
};

export default Workspace;
