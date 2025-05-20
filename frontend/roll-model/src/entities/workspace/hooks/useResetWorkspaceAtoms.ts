import {
  aiRecommendedStepsAtom,
  completedDatasetAtom,
  dataColumnsAtom,
  pipelineIdAtom,
  preprocessingStepsAtom,
  selectedSampleDatasetAtom,
  uploadedDatasetAtom,
  uploadedFileAtom,
} from '@/entities/workspace/data-config/workspaceAtoms';
import { projectCategoryAtom, projectDescriptionAtom, projectDomainAtom, projectIdAtom, projectPublicAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { useSetAtom } from 'jotai';

export const useResetWorkspaceAtoms = () => {
  const resetters = {
    resetSelectedSample: useSetAtom(selectedSampleDatasetAtom),
    resetFile: useSetAtom(uploadedFileAtom),
    resetUploadedDataset: useSetAtom(uploadedDatasetAtom),
    resetCompletedDataset: useSetAtom(completedDatasetAtom),
    resetPipelineId: useSetAtom(pipelineIdAtom),
    resetSteps: useSetAtom(preprocessingStepsAtom),
    resetDataColumns: useSetAtom(dataColumnsAtom),
    resetAiSteps: useSetAtom(aiRecommendedStepsAtom),
    resetProjectTitle: useSetAtom(projectTitleAtom),
    resetProjectDescription: useSetAtom(projectDescriptionAtom),
    resetProjectDomain: useSetAtom(projectDomainAtom),
    resetProjectCategory: useSetAtom(projectCategoryAtom),
    resetProjectPublic: useSetAtom(projectPublicAtom),
    resetProjectId: useSetAtom(projectIdAtom),
  };

  return async () => {
    resetters.resetSelectedSample(null);
    resetters.resetFile(null);
    resetters.resetUploadedDataset(null);
    resetters.resetCompletedDataset(null);
    resetters.resetPipelineId('');
    resetters.resetSteps(null);
    resetters.resetDataColumns([]);
    resetters.resetAiSteps([]);
    resetters.resetProjectTitle('');
    resetters.resetProjectDescription('');
    resetters.resetProjectDomain('GENERAL');
    resetters.resetProjectCategory('REGRESSION');
    resetters.resetProjectPublic(true);
    resetters.resetProjectId('');
  };
};
