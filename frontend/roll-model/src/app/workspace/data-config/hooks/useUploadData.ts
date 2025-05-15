import { UploadDatasetRequest } from '@/entities/workspace/data-config/model/types';
import { uploadDataset } from '@/features/workspace/data-upload/service/uploadDataset';
import { useMutation } from '@tanstack/react-query';

export const useUploadDataset = () => {
  return useMutation({
    mutationFn: ({ projectId, config, file }: { projectId: string; config: UploadDatasetRequest; file: File }) => uploadDataset(projectId, config, file),
  });
};
