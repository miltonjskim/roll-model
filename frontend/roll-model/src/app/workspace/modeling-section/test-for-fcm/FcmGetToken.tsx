import { useEffect, useState } from 'react';
import { getFCMTokenFromStorage, requestFCMToken, setupFCMListener } from '@/shared/lib/firebase/fcm';

export default function FcmGetToken() {
  const [isFcmTokenLoading, setFcmTokenIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  // 학습 진행중 상태 테스트 : PREPROCESSED, LEARNING, COMPLETED, FAILED
  const [testState, setTestState] = useState('PREPROCESSED');

  // 토큰 요청 핸들러 (로그인했을때 이거 사용)
  const handleRequestToken = async () => {
    setFcmTokenIsLoading(true);
    try {
      // 먼저 로컬 스토리지에서 fcm토큰 확인
      const isValidToken = getFCMTokenFromStorage();
      if (isValidToken) {
        setFcmToken(isValidToken);
        console.log('저장된 토큰 사용 : ', isValidToken);
        alert('저장된 토큰 사용함');
        setFcmTokenIsLoading(false);
        return;
      }

      // fcm토큰없거나 만료시
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY; //인증키 가져옴
      if (!vapidKey) {
        console.error('vapid키 없음');
        return;
      }
      const fcmToken = await requestFCMToken(vapidKey, true); // 토큰 새로발급
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

  // 학습시작 테스트 버튼 (실제 학습시작 버튼에 적용완료)
  const handleTestState = () => {
    setTestState('LEARNING');
    localStorage.setItem(`modelTrainingStatus`, 'LEARNING');
  };

  useEffect(() => {
    // 저장된 모델링상태 가져옴
    const tempStatus = localStorage.getItem(`modelTrainingStatus`);
    if (tempStatus) {
      setTestState(tempStatus);
    }
    // 저장된 fcm 토큰 가져옴
    const storedToken = getFCMTokenFromStorage();
    if (storedToken) {
      setFcmToken(storedToken);
    }
    // 모델 상태 업데이트(새로고침) 이벤트 리스너
    const handleStatusUpdate = () => {
      const currentStatus = localStorage.getItem('modelTrainingStatus');
      if (currentStatus) {
        setTestState(currentStatus);
      }
    };
    // 이벤트 리스너 등록
    window.addEventListener('modelStatusUpdate', handleStatusUpdate); // 포그라운드 전용 리스너
    window.addEventListener('storage', (e) => {
      if (e.key === 'modelTrainingStatus') {
        handleStatusUpdate();
      }
    }); // 백그라운드 전용 리스너 
    // 클린업 함수
    return () => {
      window.removeEventListener('modelStatusUpdate', handleStatusUpdate);
      window.removeEventListener('storage', handleStatusUpdate);
    };
  }, []);

  return (
    <>
      <div className="mt-4 mb-4 flex gap-6">
        <button className="cursor-pointer border border-2 border-rose-600 bg-rose-200 px-8 py-3" onClick={handleRequestToken} disabled={isFcmTokenLoading}>
          {isFcmTokenLoading ? '발급중' : '토큰발급(로그인)'}
        </button>
        <div>
          <button className="cursor-pointer border border-2 border-blue-600 bg-blue-200 px-8 py-3" onClick={handleTestState}>
            학습시작(테스트)
          </button>
          <div>{testState}</div>
        </div>
      </div>
      {fcmToken && <div className="mt-4 w-full bg-green-100 text-xs">{fcmToken}</div>}
    </>
  );
}
