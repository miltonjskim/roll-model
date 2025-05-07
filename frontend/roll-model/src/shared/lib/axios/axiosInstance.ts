import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import axios, { AxiosResponse } from 'axios';

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    // TODO: 토큰 설정하기
    // 아래 설정은 예시일 뿐, 이후 백엔드와 말해서 수정할 것
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const apiResponse = response.data;

    if (apiResponse.status !== 200 || apiResponse.error) {
      const message = apiResponse.error?.message || '알 수 없는 에러가 발생했습니다.';
      showErrorToast(message);
      return Promise.reject(new Error(message));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiResponse.data as any;
  },
  (error) => {
    const message = error.response?.data?.error?.message || '네트워크 에러가 발생했습니다.';
    console.error('API Error:', message);
    showErrorToast(message);
    return Promise.reject(error);
  },
);
