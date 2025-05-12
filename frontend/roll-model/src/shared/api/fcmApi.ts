import { axiosInstance } from '@/shared/lib/axios/axiosInstance';

// fcm토큰 서버 전송
export const sendFcmTokenToServer = async (fcmtoken: string) => {
  try {
    const response = await axiosInstance.post(`/api/v1/fcm/token`, { fcmToken: fcmtoken });
    return response.data;
  } catch (error) {
    console.error('fcm 서버 전송 실패', error);
    throw error;
  }
};
