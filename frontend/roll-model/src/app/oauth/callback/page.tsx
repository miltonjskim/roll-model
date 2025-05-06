'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { userAtom, isLoggedInAtom } from '@/features/auth/model/authAtoms';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { showErrorToast } from '@/shared/lib/toast/toast';

const CallbackPage = () => {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/auth/members/my', {
          withCredentials: true,
        });
        console.log(response);

        setUser(response.data);
        setIsLoggedIn(true);
        router.push('/');
      } catch (error) {
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
