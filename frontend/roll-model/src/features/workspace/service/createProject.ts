import { projectCategory, projectDomain } from '@/entities/workspace/model/types';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';

export interface CreateProjectRequest {
  title: string;
  description: string;
  domain: projectDomain;
  type: projectCategory;
  isPublic?: boolean;
}

export interface CreateProjectResponse {
  projectId: string;
  message: string;
}

export const createProject = async (payload: CreateProjectRequest): Promise<CreateProjectResponse> => {
  const response = await axiosInstance.post('/api/v1/projects', {
    ...payload,
    isPublic: payload.isPublic ?? true,
  });

  return response.data;
};
