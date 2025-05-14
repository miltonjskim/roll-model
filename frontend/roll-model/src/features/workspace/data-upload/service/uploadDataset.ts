import { UploadDatasetRequest, UploadDatasetResponse } from '@/entities/workspace/data-config/model/types';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { ApiResponse } from '@/shared/model/types/apiResponse';

export const uploadDataset = async (projectId: string, config: UploadDatasetRequest, file: File): Promise<ApiResponse<UploadDatasetResponse>> => {
  const formData = new FormData();
  console.log('projectId:', projectId);

  formData.append('config', JSON.stringify(config));
  formData.append('dataFile', file);

  const response = await axiosInstance.post<ApiResponse<UploadDatasetResponse>>(`/api/v2/projects/${projectId}/dataset`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
