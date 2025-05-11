import { useState } from 'react';
import { requestNotificationPermissionAndToken } from '@/shared/lib/firebase/fcm';

export default function FcmGetToken() {
  const [isFcmTokenLoading, setFcmTokenIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const handleRequestToken = async () => {
    setFcmTokenIsLoading(true);
    try {
      // 먼저 로컬 스토리지에서 토큰 확인
      const storedToken = localStorage.getItem('fcm_token');
      const tokenTimestamp = localStorage.getItem('fcm_token_timestamp');

      // 유효한 토큰이 있는지 확인 (30일 미만인 토큰 (firebase에서는 만료기간 없긴함))
      const isValidToken = storedToken && tokenTimestamp && Date.now() - parseInt(tokenTimestamp) < 30 * 24 * 60 * 60 * 1000;

      if (isValidToken) {
        setFcmToken(storedToken);
        console.log('저장된 토큰 사용 : ', storedToken);
        alert('저장된 토큰 사용함');
        setFcmTokenIsLoading(false);
        return;
      }
      // 토큰없거나 만료시
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('vapid키 없음');
        return;
      }
      const fcmToken = await requestNotificationPermissionAndToken(vapidKey);
      if (fcmToken) {
        setFcmToken(fcmToken);
        console.log('fcm토큰발급됨 : ', fcmToken);
      }
    } catch (e) {
      console.error('fcm토큰에러 : ', e);
    } finally {
      setFcmTokenIsLoading(false);
    }
  };
  return (
    <>
      <button className="mt-4 cursor-pointer border border-2 border-rose-600 bg-rose-200 px-8 py-3" onClick={handleRequestToken} disabled={isFcmTokenLoading}>
        {isFcmTokenLoading ? '발급중' : '토큰 발급'}
      </button>
      {fcmToken && <div>{fcmToken}</div>}
    </>
  );
}
