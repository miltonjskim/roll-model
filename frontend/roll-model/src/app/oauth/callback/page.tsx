'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { userAtom, isLoggedInAtom, userToken, UserInfo } from '@/features/auth/model/authAtoms';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { requestFCMToken } from '@/shared/lib/firebase/fcm';

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
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        const accessToken = getCookieValue('access_token');
        if (!accessToken) throw new Error('access_token 없음');

        sessionStorage.setItem('token', accessToken);
        setUserToken(accessToken);

        const { data: apiResponse } = await axiosInstance.get<ApiResponse<UserInfo>>('/api/v1/auth/members/my');

        if (!vapidKey) {
          showErrorToast('vapidKey가 없습니다.');
          return;
        }

        const fcmToken = await requestFCMToken(vapidKey, true);
        console.log('fcmToken:', fcmToken);

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
