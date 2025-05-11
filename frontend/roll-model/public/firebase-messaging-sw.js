// Service Worker에서 Firebase 기능 사용을 위한 라이브러리 임포트
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase 초기화 (service worker에서는 .env 접근 불가능하므로 직접 값 입력)
// 보안상 공개해도되는 정보
firebase.initializeApp({
  apiKey: 'AIzaSyBx2D1w3tLZOIjZ-wf9HeY3FMyiULt7igQ',
  authDomain: 'rollmodel-267e6.firebaseapp.com',
  projectId: 'rollmodel-267e6',
  storageBucket: 'rollmodel-267e6.firebasestorage.app',
  messagingSenderId: '536369286103',
  appId: '1:536369286103:web:84f1eba1a5731b23991992',
});

// Firebase Messaging 인스턴스 가져오기
const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title || 'Roll Model 알림';
  const notificationOptions = {
    body: payload.notification.body || '새로운 알림이 도착했습니다.',
    icon: '/fcmlogo.png', // 앱 아이콘 경로 (큰화면)
    badge: '/fcmlogo.png', // 알림 뱃지 아이콘(선택사항 : 작은화면 (모바일알림))
    data: payload.data,
    // 알림 클릭 시 이동할 URL 설정 가능
    // 클릭 액션은 클라이언트 측에서 처리됨
  };

  // 실제 시스템 알림 표시
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click');
  event.notification.close();

  // 알림 클릭 시 원하는 URL로 이동
  // 사용자가 특정 모델 결과 페이지로 이동하도록 설정 가능
  // 데이터 페이로드에서 동적으로 URL을 가져올 수 있음
  const urlToOpen = event.notification.data?.url || '/dashboard'; // 기본 URL

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // 이미 열린 창이 있는지 확인
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // 열린 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
