// fcm.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { sendFcmTokenToServer } from '@/shared/api/fcmApi';

// Firebase 구성을 .env 파일에서 로드
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase 앱 초기화
const initFcmApp = initializeApp(firebaseConfig);

// Service Worker 등록 함수 (얘가 fcm에서 클라이언트로 알림보내줌)
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      console.log('Service Worker 등록 성공:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker 등록 실패:', error);
      return null;
    }
  }
  return null;
};

// FCM 토큰 요청 함수
export const requestFCMToken = async (vapidKey: string, showAlerts = false) => {
  try {
    // 브라우저가 알림과 서비스 워커를 지원하는지 확인
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('이 브라우저는 알림 또는 서비스 워커를 지원하지 않습니다.');
      return null;
    }
    // serviceWorker 등록 확인
    await registerServiceWorker();

    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      if (showAlerts) alert('알림 권한이 거부되었습니다. 알림을 받으려면 권한을 허용해야 합니다.');
      return null;
    }
    // FCM 토큰 요청
    const messaging = getMessaging(initFcmApp);
    const currentToken = await getToken(messaging, { vapidKey });

    if (currentToken) {
      console.log('FCM 토큰:', currentToken);
      localStorage.setItem('fcm_token', currentToken); // 로컬스토리지 저장
      localStorage.setItem('fcm_token_timestamp', Date.now().toString());

      // >>>>>>>>>>>>>>>>>>>>>>>>>> 추후에 서버api 완성시 사용 >>>>>>>>>>>>>>>>
      await sendFcmTokenToServer(currentToken);
      // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      if (showAlerts) alert(`FCM 토큰이 발급되었습니다: ${currentToken}`);

      return currentToken;
    } else {
      console.log('토큰을 가져올 수 없습니다.');
      if (showAlerts) alert('FCM 토큰 발급에 실패했습니다.');
      return null;
    }
  } catch (error) {
    console.error('FCM 토큰 요청 중 오류 발생:', error);
    if (showAlerts) alert('알림 설정 중 오류가 발생했습니다.');
    return null;
  }
};

// 로컬 스토리지에서 토큰 가져오기
export const getFCMTokenFromStorage = () => {
  try {
    const token = localStorage.getItem('fcm_token');
    const timestamp = localStorage.getItem('fcm_token_timestamp');

    // 토큰이 없거나 발급된지 30일 이상 지났으면 null 반환 (firebase에서는 만료기간 없긴함)
    if (!token || !timestamp) return null;

    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30일

    return tokenAge < maxAge ? token : null;
  } catch (error) {
    console.error('로컬 스토리지에서 토큰 가져오기 실패:', error);
    return null;
  }
};

// 포그라운드 메시지 리스너 설정
export const setupFCMListener = (onFCMMessage: (payload: any) => void) => {
  try {
    const messaging = getMessaging(initFcmApp);

    // 포그라운드 메시지 리스너
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('포그라운드 메시지 수신:', payload);
      onFCMMessage(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('FCM 리스너 설정 중 오류 발생:', error);
    return () => {};
  }
};
