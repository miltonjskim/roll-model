import { showErrorToast } from '@/shared/lib/toast/toast';
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  const cookie = document.cookie.split('; ').find((row) => row.startsWith('access_token='));

  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    // TODO: 로컬 개발 종료 후 해당 주석 해제 및 아래 코드 주석화
    const token = getAccessToken();

    // TODO: 로컬 테스트용 토큰 추가
    // const token = process.env.NEXT_PUBLIC_API_TEST_TOKEN;
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
    const message = error.response?.data?.error?.message || '네트워크 에러가 발생했습니다.';
    console.error('API Error:', message);
    showErrorToast(message);
    return Promise.reject(error);
  },
);
