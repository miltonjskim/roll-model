'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// 모델 상태에 대한 타입 정의
type ModelStatus = 'LEARNING' | 'COMPLETED' | 'FAILED' | 'PREPROCESSED' | string;

export default function FcmCatStatus() {
  // 현재 모델 상태를 저장하는 상태 변수

  const [modelStatus, setModelStatus] = useState<ModelStatus>('');

  // 모델 상태에 따라 이미지 경로 결정
  const getCatImage = (status: ModelStatus): string => {
    if (status === 'COMPLETED') return '/completedCat.png';
    if (status === 'FAILED') return '/failedCat.png';
    if (status === 'LEARNING') return '/rollingCat.gif';
    return '/ready.png'; // PREPROCESSED 또는 기타 상태
  };

  useEffect(() => {
    // console.log('Cat: 컴포넌트 마운트, 현재 상태:', modelStatus);
    const savedStatus = localStorage.getItem('modelTrainingStatus') as ModelStatus;
    setModelStatus(savedStatus);

    // 모델 상태 업데이트(새로고침) 이벤트 리스너
    const handleStatusUpdate = () => {
      const currentStatus = localStorage.getItem('modelTrainingStatus') as ModelStatus;
      // console.log('Cat: 모델 상태 업데이트 이벤트 감지', currentStatus);
      if (currentStatus) {
        setModelStatus(currentStatus);
      }
    };

    // storage 이벤트 리스너 - 다른 탭에서 localStorage 변경 시
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'modelTrainingStatus') {
        console.log('Cat: 스토리지 이벤트 감지', e.newValue);
        if (e.newValue) {
          setModelStatus(e.newValue as ModelStatus);
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('modelStatusUpdate', handleStatusUpdate);
    window.addEventListener('storage', handleStorageChange);

    // 컴포넌트 언마운트 시 정리
    return () => {
      window.removeEventListener('modelStatusUpdate', handleStatusUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // modelStatus가 변경될 때마다 타이머 재설정

  // 현재 모델 상태에 따른 이미지 경로
  const catImage = getCatImage(modelStatus);

  const handleStartLearning = (type: string) => {
    switch (type) {
      case '기본':
        localStorage.setItem('modelTrainingStatus', 'PREPROCESSED');
        setModelStatus('PREPROCESSED');
        break;
      case '학습중':
        localStorage.setItem('modelTrainingStatus', 'LEARNING');
        setModelStatus('LEARNING');
        break;
      case '실패':
        localStorage.setItem('modelTrainingStatus', 'FAILED');
        setModelStatus('FAILED');
        break;
      case '완료':
        localStorage.setItem('modelTrainingStatus', 'COMPLETED');
        setModelStatus('COMPLETED');
        break;
    }
    window.dispatchEvent(new Event('modelStatusUpdate'));
    console.log(`Cat: 상태를 ${type === '기본' ? 'PREPROCESSED' : type === '학습중' ? 'LEARNING' : type === '실패' ? 'FAILED' : 'COMPLETED'}으로 변경`);
  };
  const handleReset = () => {
    // localStorage 업데이트
    if (modelStatus === 'COMPLETED') {
      localStorage.setItem('modelTrainingStatus', 'PREPROCESSED');
      // 컴포넌트 상태 업데이트
      setModelStatus('PREPROCESSED');
      window.dispatchEvent(new Event('modelStatusUpdate'));
      console.log('Cat: 상태를 PREPROCESSED로 변경');
    }
  };

  return (
    <div className="fixed bottom-40 left-4 z-50 h-20 w-30">
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
      <Image src={catImage} alt={`Status Cat (${modelStatus})`} width={80} height={80} className="object-contain" priority unoptimized onClick={handleReset} />
    </div>
  );
}
