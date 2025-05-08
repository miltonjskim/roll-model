import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import axios, { AxiosResponse } from 'axios';

export const baseAxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCookieValue = (key: string): string | null => {
  const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${key}=`));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

const token = getCookieValue('access_token');

// 요청 인터셉터
baseAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('baseAxiosInstance token:', token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터
baseAxiosInstance.interceptors.response.use(
  <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    const apiResponse = response.data;

    // api 응답 status 에러 발생 시
    if (apiResponse.status >= 400 || apiResponse.error) {
      const message = apiResponse.error?.message || '알 수 없는 에러가 발생했습니다.';
      showErrorToast(message);
      throw new Error(message);
    }

    return apiResponse.data;
  },

  // HTTP 응답 에러 시
  (error) => {
    const message = error.response?.data?.error?.message || '네트워크 에러가 발생했습니다.';
    console.error('API Error:', message);
    showErrorToast(message);
    return Promise.reject(error);
  },
);
