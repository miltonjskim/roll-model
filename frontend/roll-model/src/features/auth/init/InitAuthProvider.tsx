'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { isLoggedInAtom, userAtom } from '@/features/auth/model/authAtoms';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';

export const InitAuthProvider = () => {
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const setUser = useSetAtom(userAtom);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/auth/members/my');
        setUser(res.data); // 유저 정보 저장
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkLogin();
  }, [setIsLoggedIn, setUser]);

  return null; // 렌더링은 없음
};
