'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { userAtom, isLoggedInAtom, userToken, UserInfo } from '@/features/auth/model/authAtoms';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { getFCMTokenFromStorage, requestFCMToken } from '@/shared/lib/firebase/fcm';

const CallbackPage = () => {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const setUserToken = useSetAtom(userToken);

  useEffect(() => {
    const getCookieValue = (key: string): string | null => {
      const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${key}=`));
      return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
    };

    const fetchUser = async () => {
      try {
        const tempvapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        console.log('vapidKey in CallbackPage : ', tempvapidKey);
        const vapidKey = tempvapidKey || 'BEPr0IW8hR5D8BHgKlBQD9BzlTxa_G8owaqbZANbikIXzqZB_uzQOZuP3w-nUBKM2bUMSJ0jIh6vFDozXoUYY_Q';
        const accessToken = getCookieValue('access_token');
        if (!accessToken) throw new Error('access_token 없음');

        sessionStorage.setItem('token', accessToken);
        setUserToken(accessToken);

        const { data: apiResponse } = await axiosInstance.get<ApiResponse<UserInfo>>('/api/v1/auth/members/my');
        console.log('환경 변수 확인 in CallbackPage :');
        console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
        console.log('VAPID_KEY:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
        console.log('AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);

        if (!vapidKey) {
          showErrorToast('vapidKey가 없습니다.');
          return;
        }

        const isValidToken = getFCMTokenFromStorage(); // 로컬 스토리지에서 fcm토큰 확인
        if (isValidToken) {
          console.log('fcm settup'); // 있으면 그냥사용
        } else {
          const fcmToken = await requestFCMToken(vapidKey); // 없으면 새로발급
          console.log('fcmToken새로발급:', fcmToken);
        }

        setUser(apiResponse.data);
        setIsLoggedIn(true);
        router.push('/');
      } catch (error) {
        console.error(error);
        setIsLoggedIn(false);
        showErrorToast('로그인 정보 확인에 실패했습니다.');
        router.push('/');
      }
    };

    fetchUser();
  }, [router, setUser, setIsLoggedIn, setUserToken]);

  return <div className="py-10 text-center text-xl">로그인 중입니다...</div>;
};

export default CallbackPage;
