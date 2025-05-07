import { UploadDatasetRequest } from '@/entities/workspace/data-config/model/types';
import { baseAxiosInstance } from '@/shared/lib/axios/baseAxiosInstance';

export const uploadDataset = async (projectId: string, config: UploadDatasetRequest, file: File): Promise<void> => {
  const formData = new FormData();

  formData.append('config', new Blob([JSON.stringify(config)], { type: 'application/json' }));
  formData.append('dataFile', file);

  await baseAxiosInstance.post(`/api/v2/projects/${projectId}/dataset`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
