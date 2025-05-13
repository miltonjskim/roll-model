'use client';

import { Button } from '@/components/ui/button';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiError } from '@/shared/model/types/apiResponse';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Workspace = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = () => {
    router.push('/workspace/project-meta');
  };

  const fetchMyProject = async () => {
    // TODO: 내 프로젝트 재학습 목록이 뜨게.. 렌더링 방식은 아직 생각 못함
    setIsLoading(true);

    try {
      const response = await axiosInstance('/api/v1/projects/my');
      console.log('response:', response);
    } catch (error) {
      const apiError = error as ApiError;
      showErrorToast(apiError.message);
      console.error(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-xl font-bold">시작하기</h1>
        <h2>시작할 프로젝트를 선택하세요.</h2>
      </div>
      <div className="mx-auto mt-4 max-w-[70rem]">
        <div className="bg-[theme(primary-white)] flex h-120 justify-center gap-4 rounded-md p-4">
          <Button variant="black" onClick={handleCreateProject} className="h-full w-1/2 text-lg">
            + 새로운 프로젝트 만들기
          </Button>
          <Button variant="outline" onClick={fetchMyProject} className="hover:bg-[theme(color-gray-04)] h-full w-1/2 text-lg">
            최근 프로젝트에서 재학습
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
