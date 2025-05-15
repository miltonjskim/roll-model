// Service Worker에서 Firebase 기능 사용을 위한 라이브러리 임포트
importScripts('https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.7.1/firebase-messaging-compat.js');

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


  // Firebase 콘솔에서 보낸 메시지(notification 포함)인지 확인
  const hasFirebaseNotification = payload.notification !== undefined;
  // 상태 값이 있으면 IndexedDB에 저장
  // if (payload.data?.state) {

  //   saveStateToIndexedDB(payload.data.state);
  // }
  // 실제 메시지 형식에 맞게 제목과 내용 추출
  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    payload.fcmOptions?.title ||
    payload.google?.c?.a?.c_l || // 실제 수신된 형식
    'Roll Model 알림';

  const notificationBody = payload.notification?.body || payload.data?.body || payload.fcmOptions?.body || payload.data?.message || '새로운 알림이 도착했습니다.';

  const notificationOptions = {
    body: notificationBody,
    icon: '/fcmlogo.png',
    badge: '/fcmlogo.png',
    data: {
      ...payload.data,
      // 중요: Firebase 콘솔에서 온 경우에도 state 정보 보존
      state: payload.data?.state || 'UNKNOWN',
      // 추가적인 데이터 보존
      firebaseNotification: hasFirebaseNotification,
    },
    tag: 'rollmodel-notification', // 알림 중복 방지
  };

  console.log('[firebase-messaging-sw.js] Showing notification with title: ', notificationTitle);
  console.log('[firebase-messaging-sw.js] Notification options: ', notificationOptions);

  // 실제 시스템 알림 표시
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// IndexedDB에 상태 저장 함수
// function saveStateToIndexedDB(state) {
//   console.log('[SW] saveStateToIndexedDB 호출됨, 저장할 상태:', state);
  
//   const request = indexedDB.open('RollModelDB', 1);
  
//   request.onerror = function(event) {
//     console.error('[SW] IndexedDB 열기 오류:', event.target.error);
//   };
  
//   request.onblocked = function(event) {
//     console.warn('[SW] IndexedDB 열기가 차단됨:', event);
//   };

//   request.onupgradeneeded = function(event) {
//     console.log('[SW] IndexedDB 업그레이드 중');
//     const db = event.target.result;
//     if (!db.objectStoreNames.contains('modelStatus')) {
//       db.createObjectStore('modelStatus', { keyPath: 'id' });
//       console.log('[SW] modelStatus 저장소 생성됨');
//     }
//   };

//   request.onsuccess = function(event) {
//     console.log('[SW] IndexedDB 열기 성공');
//     const db = event.target.result;
    
//     // 트랜잭션 생성
//     try {
//       const transaction = db.transaction(['modelStatus'], 'readwrite');
      
//       transaction.oncomplete = function() {
//         console.log('[SW] 트랜잭션 완료, 상태 저장 성공');
//       };
      
//       transaction.onerror = function(event) {
//         console.error('[SW] 트랜잭션 오류:', event.target.error);
//       };
      
//       transaction.onabort = function(event) {
//         console.warn('[SW] 트랜잭션 중단:', event);
//       };
      
//       const store = transaction.objectStore('modelStatus');
//       const dataToStore = { 
//         id: 'currentStatus', 
//         state: state, 
//         timestamp: Date.now() 
//       };
      
//       console.log('[SW] 저장할 데이터:', dataToStore);
      
//       const putRequest = store.put(dataToStore);
      
//       putRequest.onsuccess = function(event) {
//         console.log('[SW] put 요청 성공:', event.target.result);
//       };
      
//       putRequest.onerror = function(event) {
//         console.error('[SW] put 요청 오류:', event.target.error);
//       };
//     } catch (error) {
//       console.error('[SW] 트랜잭션 생성 중 예외 발생:', error);
//     }
//   };
// }

// 알림 클릭 이벤트 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click');
  event.notification.close();

  // 데이터에서 상태 정보 추출
  const newState = event.notification.data?.state;
  const urlToOpen = event.notification.data?.url || '/dashboard'; // 기본 URL

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      let clientFocused = false;

      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];

        // 모든 열린 클라이언트에 상태 업데이트 메시지 전송
        if (newState) {
          client.postMessage({
            type: 'UPDATE_MODEL_STATUS',
            state: newState,
          });
        }

        // 해당 URL이 포함된 창이 있으면 포커스
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          clientFocused = true;
          client.focus();
          break;
        }
      }

      // 포커스된 창이 없으면 새 창 열기
      if (!clientFocused && clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
