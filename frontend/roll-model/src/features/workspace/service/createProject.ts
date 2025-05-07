import { projectCategory, projectDomain } from '@/entities/workspace/model/types';
import { baseAxiosInstance } from '@/shared/lib/axios/baseAxiosInstance';
import { ApiResponse } from '@/shared/model/types/apiResponse';

export interface CreateProjectRequest {
  title: string;
  description: string;
  domain: projectDomain;
  type: projectCategory;
  isPublic?: boolean;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  domain: projectDomain;
  type: projectCategory;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateProjectResponse {
  projectId: string;
  message: string;
}

export const createProject = async (payload: CreateProjectRequest): Promise<Project> => {
  const response = await baseAxiosInstance.post<ApiResponse<Project>>('/api/v1/projects', {
    ...payload,
    isPublic: payload.isPublic ?? true,
  });

  return response.data.data;
};
