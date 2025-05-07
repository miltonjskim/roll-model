'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { userAtom, isLoggedInAtom } from '@/features/auth/model/authAtoms';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { baseAxiosInstance } from '@/shared/lib/axios/baseAxiosInstance';

const CallbackPage = () => {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);

  useEffect(() => {
    const getCookieValue = (key: string): string | null => {
      const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${key}=`));
      return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
    };

    const fetchUser = async () => {
      try {
        const accessToken = getCookieValue('access_token');
        if (!accessToken) throw new Error('access_token 없음');

        sessionStorage.setItem('token', accessToken);

        const response = await baseAxiosInstance.get('/api/v1/auth/members/my', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setUser(response.data);
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
  }, [router, setUser, setIsLoggedIn]);

  return <div className="py-10 text-center text-xl">로그인 중입니다...</div>;
};

export default CallbackPage;
