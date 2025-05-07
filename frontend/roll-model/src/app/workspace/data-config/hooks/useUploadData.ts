import { UploadDatasetRequest } from '@/entities/workspace/data-config/model/types';
import { uploadDataset } from '@/features/workspace/data-upload/service/uploadDataset';
import { useMutation } from '@tanstack/react-query';

export const useUploadDataset = (projectId: string) => {
  return useMutation({
    mutationFn: (params: { config: UploadDatasetRequest; file: File }) => uploadDataset(projectId, params.config, params.file),
  });
};
