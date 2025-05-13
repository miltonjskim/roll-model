'use client';
import { useEffect } from 'react';
import { getFCMTokenFromStorage, requestFCMToken, setupFCMListener } from '@/shared/lib/firebase/fcm';

export default function ClientFCMInitializer() {
  useEffect(() => {
    const initFCM = async () => {
      try {
        // 이미 저장된 유효한 토큰이 있는지 확인
        const token = getFCMTokenFromStorage();

        // 토큰이 있으면 FCM 초기화
        if (token) {
          console.log('FCM 초기화 (기존 토큰 사용)');
          setupFCMGlobalListeners();
        } else {
          // 로그인 상태 확인
          const isLoggedIn = sessionStorage.getItem('token');
          if (isLoggedIn) {
            // 로그인 상태면 자동으로 FCM 토큰 요청 시도
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            console.log('vapid in initializer : ', vapidKey);

            if (vapidKey) {
              const newToken = await requestFCMToken(vapidKey);
              if (newToken) {
                console.log('FCM 초기화 (새 토큰 발급)');
                setupFCMGlobalListeners();
              }
            }
          }
        }
        // 클린업 함수
        return () => {};
      } catch (error) {
        console.error('FCM 초기화 중 오류:', error);
      }
    };

    initFCM();
  }, []);

  // 통합된 FCM 리스너 설정 함수
  const setupFCMGlobalListeners = () => {
    // 1. 포그라운드 메시지 리스너 (fcmInit.ts에서 가져옴)
    setupFCMListener((payload) => {
      // 데이터 페이로드에서 상태 값 추출
      const newState = payload.data?.state;
      if (newState) {
        // localStorage 업데이트
        localStorage.setItem('modelTrainingStatus', newState);

        // 상태 변경 이벤트 발생
        window.dispatchEvent(
          new CustomEvent('modelStatusUpdate', {
            detail: { state: newState },
          }),
        );
      }
    });

    // 2. 백그라운드 메시지 핸들러 (Service Worker에서 받은 메시지 처리)
    const handleServiceWorkerMessage = (event: any) => {
      if (event.data && event.data.type === 'UPDATE_MODEL_STATUS') {
        const newState = event.data.state;
        console.log('Service Worker에서 상태 업데이트 수신:', newState);

        // localStorage 업데이트
        localStorage.setItem('modelTrainingStatus', newState);

        // 상태 변경 이벤트 발생
        window.dispatchEvent(
          new CustomEvent('modelStatusUpdate', {
            detail: { state: newState },
          }),
        );
      }
    };

    // 메시지 이벤트 리스너 등록
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
  };

  return null; // UI 렌더링 없음
}
