import { projectCategory, projectDomain } from '@/entities/workspace/model/types';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
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

export const createProject = async (payload: CreateProjectRequest): Promise<ApiResponse<Project>> => {
  const { data } = await axiosInstance.post<ApiResponse<Project>>('/api/v1/projects', {
    ...payload,
    isPublic: payload.isPublic ?? true,
  });

  return data;
};
