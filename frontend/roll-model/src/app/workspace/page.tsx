'use client';

import { Button } from '@/components/ui/button';
import { registerInitProjectSteps } from '@/features/guide/steps/initProjectSteps';
import { startGuide } from '@/features/guide/useGuide';
import GuideStartButton from '@/shared/ui/GuideStartButton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Workspace = () => {
  const router = useRouter();

  useEffect(() => {
    registerInitProjectSteps();
    startGuide();
  }, []);

  const handleCreateProject = () => {
    router.push('/workspace/project-meta');
  };

  const moveToMyProjectListPage = () => {
    router.push('/workspace/retrain');
  };

  return (
    <div className="select-none">
      <div>
        <h1 className="text-xl font-bold">시작하기</h1>
        <h2>시작할 프로젝트를 선택하세요.</h2>
        {/* <Button onClick={startGuide}>가이드 시작하기</Button> */}
      </div>
      <div className="mx-auto mt-4 max-w-[70rem]">
        <div className="bg-[theme(primary-white)] flex h-120 justify-center gap-4 rounded-md p-4">
          <Button variant="black" onClick={handleCreateProject} className="add-project-btn h-full w-1/2 text-lg">
            + 새로운 프로젝트 만들기
          </Button>
          <Button variant="outline" onClick={moveToMyProjectListPage} className="hover:bg-[theme(color-gray-04)] retrain-project-btn h-full w-1/2 text-lg">
            최근 프로젝트에서 재학습
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
