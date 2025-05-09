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
    let token: string | null = null;

    if (process.env.NODE_ENV === 'development') {
      // 개발 환경: 테스트 토큰 사용
      token = process.env.NEXT_PUBLIC_API_TEST_TOKEN || null;
    } else {
      // 운영/스테이징: 실제 쿠키에서 가져오기
      token = getAccessToken();
    }

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
