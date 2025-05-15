'use client';
import { useEffect } from 'react';
import { getFCMTokenFromStorage, requestFCMToken, setupFCMListener } from '@/shared/lib/firebase/fcm';

export default function ClientFCMInitializer() {
  useEffect(() => {
    const initFCM = async () => {
      try {
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
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BEPr0IW8hR5D8BHgKlBQD9BzlTxa_G8owaqbZANbikIXzqZB_uzQOZuP3w-nUBKM2bUMSJ0jIh6vFDozXoUYY_Q';
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

        // visibilitychange 이벤트 리스너 추가
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 초기 상태 확인 및 업데이트
        checkAndUpdateModelStatus();
        // 클린업 함수
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (error) {
        console.error('FCM 초기화 중 오류:', error);
      }
    };

    initFCM();
  }, []);
  // 가시성 변경 핸들러
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('앱이 포그라운드로 전환됨, 모델 상태 확인');
      // IndexedDB에서 상태 확인
      checkStateFromIndexedDB();
      checkAndUpdateModelStatus();
    }
  };

  // IndexedDB에서 상태 확인 함수
  const checkStateFromIndexedDB = () => {
    console.log('that?');

    const request = indexedDB.open('RollModelDB', 1);
    console.log('what?', request);

    request.onupgradeneeded = function (event) {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('modelStatus')) {
        db.createObjectStore('modelStatus', { keyPath: 'id' });
      }
    };

    request.onsuccess = function (event) {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['modelStatus'], 'readonly');
      const store = transaction.objectStore('modelStatus');

      const getRequest = store.get('currentStatus');

      getRequest.onsuccess = function () {
        if (getRequest.result && getRequest.result.state) {
          const state = getRequest.result.state;
          console.log('IndexedDB에서 상태 확인:', state);

          // localStorage 업데이트
          localStorage.setItem('modelTrainingStatus', state);

          // 상태 변경 이벤트 발생
          window.dispatchEvent(
            new CustomEvent('modelStatusUpdate', {
              detail: { state: state },
            }),
          );
        }
      };
    };
  };

  // 모델 상태 확인 및 업데이트 함수
  const checkAndUpdateModelStatus = () => {
    const currentStatus = localStorage.getItem('modelTrainingStatus');
    if (currentStatus) {
      console.log('저장된 모델 상태 확인:', currentStatus);
      // 상태 변경 이벤트 발생
      window.dispatchEvent(
        new CustomEvent('modelStatusUpdate', {
          detail: { state: currentStatus },
        }),
      );
    }
  };
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
