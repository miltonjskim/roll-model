'use client';

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { initUserTokenAtom, isLoggedInAtom, userAtom, UserInfo, userToken } from '@/features/auth/model/authAtoms';
import { baseAxiosInstance } from '@/shared/lib/axios/baseAxiosInstance';

export const InitAuthProvider = () => {
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const setUser = useSetAtom(userAtom);
  const token = useAtomValue(userToken);
  const setInitUserToken = useSetAtom(initUserTokenAtom);

  useEffect(() => {
    setInitUserToken();
  }, [setInitUserToken]);

  useEffect(() => {
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    const checkLogin = async () => {
      try {
        const res = await baseAxiosInstance.get<UserInfo, UserInfo>('/api/v1/auth/members/my');

        setUser(res);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkLogin();
  }, [token, setIsLoggedIn, setUser]);

  return null;
};
