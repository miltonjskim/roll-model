import { showErrorToast } from '@/shared/lib/toast/toast';
import axios from 'axios';

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
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = localToken || process.env.NEXT_PUBLIC_API_TEST_TOKEN; // 테스트토큰 추가 (없어도됨)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    let message;
    if (error.response) {
      message = error.response.data?.error.message;
      console.error('API Error:', error.response.data?.message || error.message);
    } else {
      message = '네트워크 에러가 발생했습니다.';
      console.error('Network Error:', error.message);
    }
    showErrorToast(message);
    return Promise.reject(error);
  },
);
