'use client';

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { initUserTokenAtom, isLoggedInAtom, userAtom, UserInfo, userToken } from '@/features/auth/model/authAtoms';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { getFCMTokenFromStorage, requestFCMToken } from '@/shared/lib/firebase/fcm';
import { showErrorToast } from '@/shared/lib/toast/toast';

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
        const { data: apiResponse } = await axiosInstance.get<ApiResponse<UserInfo>>('/api/v1/auth/members/my');
        const tempvapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        console.log('vapidKey in checkLogin : ', tempvapidKey);
        const vapidKey = tempvapidKey || 'BEPr0IW8hR5D8BHgKlBQD9BzlTxa_G8owaqbZANbikIXzqZB_uzQOZuP3w-nUBKM2bUMSJ0jIh6vFDozXoUYY_Q';

        console.log('checkLogin res:', apiResponse);
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
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkLogin();
  }, [token, setIsLoggedIn, setUser]);

  return null;
};
