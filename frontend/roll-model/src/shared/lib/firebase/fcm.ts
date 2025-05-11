// fcm.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

// Service Worker 등록 함수
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
export const requestFCMToken = async (vapidKey: string) => {
  try {
    // serviceWorker 등록 확인
    await registerServiceWorker();

    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      return null;
    }

    // 브라우저가 알림과 서비스 워커를 지원하는지 확인
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('이 브라우저는 알림 또는 서비스 워커를 지원하지 않습니다.');
      return null;
    }

    // FCM 토큰 요청
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, { vapidKey });

    if (currentToken) {
      console.log('FCM 토큰:', currentToken);
      localStorage.setItem('fcm_token', currentToken); // 로컬스토리지 저장
      localStorage.setItem('fcm_token_timestamp', Date.now().toString());
      return currentToken;
    } else {
      console.log('토큰을 가져올 수 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('FCM 토큰 요청 중 오류 발생:', error);
    return null;
  }
};

// 포그라운드 메시지 리스너 설정
export const setupFCMListener = (onFCMMessage: (payload: any) => void) => {
  try {
    const messaging = getMessaging(app);

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

// FCM 토큰 요청 및 알림 권한 체크 통합 함수 (테스트용 버튼에서 사용)
export const requestNotificationPermissionAndToken = async (vapidKey: string) => {
  try {
    // 알림 권한 확인
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return null;
    }

    // 권한 요청
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      // FCM 토큰 요청
      const token = await requestFCMToken(vapidKey);
      if (token) {
        alert(`FCM 토큰이 발급되었습니다: ${token}`);
        return token;
      } else {
        alert('FCM 토큰 발급에 실패했습니다.');
        return null;
      }
    } else {
      alert('알림 권한이 거부되었습니다. 알림을 받으려면 권한을 허용해야 합니다.');
      return null;
    }
  } catch (error) {
    console.error('알림 권한 요청 중 오류 발생:', error);
    alert('알림 설정 중 오류가 발생했습니다.');
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