'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/entities/dashboard/model/types';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiError } from '@/shared/model/types/apiResponse';
import { ProjectCardCompact } from '@/features/workspace/retrain/ui/ProjectCard';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const statusSections = [
  { type: 'COMPLETED', label: '성공한 프로젝트', emoji: '✅' },
  { type: 'PREPROCESSED', label: '전처리 완료 프로젝트', emoji: '📊' },
  { type: 'FAILED', label: '실패한 프로젝트', emoji: '❌' },
] as const;

const ProjectRetrainSelectionPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [myProjectList, setMyProjectList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/v1/projects/my');
      setMyProjectList(data.data.projects);
    } catch (error) {
      const apiError = error as ApiError;
      showErrorToast(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const moveToRetrain = (project: Project): void => {
    if (project.status === 'COMPLETED') {
      setSelectedProject(project);
      setShowSelectionModal(true);
    } else {
      router.push(`/workspace/train/${project.id}`);
    }
  };

  return (
    <div className="flex flex-col justify-center">
      <div>
        <h1 className="text-xl font-bold">내 프로젝트 목록</h1>
        <p className="text-sm text-gray-600">재학습 가능한 프로젝트를 확인하세요.</p>
      </div>
      <div className="bg-[theme(primary-white)] mt-6 grid grid-cols-1 gap-4 rounded-md p-6 md:grid-cols-3">
        {statusSections.map(({ type, label, emoji }) => {
          const filteredProjects = myProjectList.filter((p) => p.status === type);
          return (
            <div key={type}>
              <h3 className="mb-4 text-lg font-bold">
                <span className="font-tossface">{emoji} </span>
                {label}
              </h3>
              <div className="max-h-[50rem] space-y-4 overflow-y-auto">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project: Project) => <ProjectCardCompact key={project.id} project={project} onClick={() => moveToRetrain(project)} />)
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg p-6 text-center text-sm text-gray-500">
                    <span className="font-tossface mb-2 text-4xl">📭</span>
                    <p>해당 상태의 프로젝트가 없습니다.</p>
                    <p className="mt-1 text-xs">학습 완료된 프로젝트가 여기에 표시됩니다.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={showSelectionModal} onOpenChange={setShowSelectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>재학습 방법 선택</DialogTitle>
            <DialogDescription>선택한 프로젝트로 어떤 재학습을 진행할까요?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push(`/workspace/preprocess/${selectedProject?.id}`)}>데이터 전처리부터</Button>
            <Button onClick={() => router.push(`/workspace/train/${selectedProject?.id}`)}>모델 학습부터</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectRetrainSelectionPage;
