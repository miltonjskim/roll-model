'use client';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { LottieRefCurrentProps } from 'lottie-react';

// Lottie 컴포넌트를 동적 임포트 (SSR 비활성화)
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// 모델 상태에 대한 타입 정의
type ModelStatus = 'LEARNING' | 'COMPLETED' | 'FAILED' | 'PREPROCESSED' | string;

export default function FcmCatStatus() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('');
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [currentAnimation, setCurrentAnimation] = useState<any>(null);

  // 모델 상태에 따라 애니메이션 경로 결정
  const getCatAnimationPath = (status: ModelStatus): string => {
    if (status === 'COMPLETED') return '/lottie/completedCat.json';
    if (status === 'FAILED') return '/lottie/temp04.json';
    if (status === 'LEARNING') return '/lottie/temp05.json';
    return '/lottie/ready.json'; // PREPROCESSED 또는 기타 상태
  };
  // 모델 상태에 따른 애니메이션 크기 설정
  const getAnimationSize = (status: ModelStatus) => {
    switch (status) {
      case 'LEARNING':
        return { width: 100, height: 100 };
      case 'COMPLETED':
        return { width: 70, height: 70 };
      case 'FAILED':
        return { width: 120, height: 120 };
      case 'PREPROCESSED':
      default:
        return { width: 120, height: 120 };
    }
  };

  // 애니메이션 JSON 파일 로드
  const loadAnimation = async (path: string) => {
    try {
      const response = await fetch(path);
      const animationData = await response.json();
      setCurrentAnimation(animationData);
    } catch (error) {
      console.error('애니메이션 로드 실패:', error);
    }
  };

  useEffect(() => {
    // 상태가 변경될 때마다 애니메이션 로드
    const animationPath = getCatAnimationPath(modelStatus);
    loadAnimation(animationPath);
  }, [modelStatus]);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행되도록 체크
    if (typeof window !== 'undefined') {
      // console.log('Cat: 컴포넌트 마운트, 현재 상태:', modelStatus);
      const savedStatus = localStorage.getItem('modelTrainingStatus') as ModelStatus;
      if (savedStatus) {
        setModelStatus(savedStatus);
      }

      // 모델 상태 업데이트(새로고침) 이벤트 리스너
      const handleStatusUpdate = (event?: CustomEvent) => {
        // 1. 이벤트 객체에 detail이 있는 경우 (CustomEvent)
        if (event && 'detail' in event && event.detail?.state) {
          setModelStatus(event.detail.state as ModelStatus);
          return;
        }

        // 2. 기존 방식 (localStorage에서 읽기)
        const currentStatus = localStorage.getItem('modelTrainingStatus') as ModelStatus;
        if (currentStatus) {
          setModelStatus(currentStatus);
        }
      };

      // storage 이벤트 리스너는 그대로 유지
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'modelTrainingStatus') {
          console.log('Cat: 스토리지 이벤트 감지', e.newValue);
          if (e.newValue) {
            setModelStatus(e.newValue as ModelStatus);
          }
        }
      };

      // 이벤트 리스너 등록 (as any를 사용해 타입 이슈 해결)
      window.addEventListener('modelStatusUpdate', handleStatusUpdate as any);
      window.addEventListener('storage', handleStorageChange);

      // 컴포넌트 언마운트 시 정리
      return () => {
        window.removeEventListener('modelStatusUpdate', handleStatusUpdate as any);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  const handleStartLearning = (type: string) => {
    console.log(`handleStartLearning 호출됨: ${type}`);
    let newStatus: ModelStatus;

    switch (type) {
      case '기본':
        newStatus = 'PREPROCESSED';
        break;
      case '학습중':
        newStatus = 'LEARNING';
        break;
      case '실패':
        newStatus = 'FAILED';
        break;
      case '완료':
        newStatus = 'COMPLETED';
        break;
      default:
        newStatus = 'PREPROCESSED';
    }
    // localStorage와 상태 모두 업데이트
    localStorage.setItem('modelTrainingStatus', newStatus);
    setModelStatus(newStatus);

    // 커스텀 이벤트 발생
    window.dispatchEvent(new Event('modelStatusUpdate'));

    console.log(`Cat: 상태를 ${newStatus}으로 변경`);
  };

  const handleReset = () => {
    // localStorage 업데이트
    if (modelStatus === 'COMPLETED' || modelStatus === 'FAILED') {
      localStorage.setItem('modelTrainingStatus', 'PREPROCESSED');
      // 컴포넌트 상태 업데이트
      setModelStatus('PREPROCESSED');
      window.dispatchEvent(new Event('modelStatusUpdate'));
      console.log('Cat: 상태를 PREPROCESSED로 변경');
    }
  };

  return (
    <div className="fixed bottom-20 left-4 z-50 h-20 w-30">
      {isButtonVisible && (
        <div>
          <button className="bg-[theme(color-mint-03)] m-1 cursor-pointer" onClick={() => handleStartLearning('기본')}>
            기본
          </button>
          <button className="bg-[theme(color-rose-03)] m-1 cursor-pointer" onClick={() => handleStartLearning('학습중')}>
            학습중
          </button>
          <button className="bg-[theme(color-green-03)] m-1 cursor-pointer" onClick={() => handleStartLearning('실패')}>
            실패
          </button>
          <button className="bg-[theme(color-yellow-03)] m-1 cursor-pointer" onClick={() => handleStartLearning('완료')}>
            완료
          </button>
        </div>
      )}
      <button onClick={() => setIsButtonVisible(!isButtonVisible)} className="opacity-[10%] hover:opacity-[30%]">
        📦
      </button>
      {/* Lottie 컴포넌트와 애니메이션이 존재할 때만 렌더링 */}
      <div onClick={handleReset} className={`${modelStatus === 'COMPLETED' ? 'mt-6 ml-6' : ''}`}>
        {currentAnimation && Lottie && (
          <Lottie
            lottieRef={lottieRef}
            animationData={currentAnimation}
            loop={true}
            // loop={modelStatus === 'LEARNING'} // LEARNING 상태에서만 반복 재생
            autoplay={true}
            style={{
              width: getAnimationSize(modelStatus).width,
              height: getAnimationSize(modelStatus).height,
            }}
            className="cursor-pointer object-contain"
          />
        )}
      </div>
    </div>
  );
}
