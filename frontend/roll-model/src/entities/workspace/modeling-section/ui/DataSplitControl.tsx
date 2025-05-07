'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

interface DataSplitControlProps {
  dataSplit: number;
  onDataSplitChange: (value: number) => void;
}

const DataSplitControl = ({ dataSplit, onDataSplitChange }: DataSplitControlProps) => {
  // 컨테이너 참조
  const containerRef = useRef<HTMLDivElement>(null);
  // 드래그 중인지 상태
  const [isDragging, setIsDragging] = useState(false);

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // 드래그 중 핸들러 - useCallback으로 메모이제이션
  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = Math.min(Math.max(Math.round(((e.clientX - rect.left) / rect.width) * 100), 50), 90);
      onDataSplitChange(newPercent);
    },
    [isDragging, onDataSplitChange],
  );

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 마우스 이벤트 리스너 설정 및 정리
  //React Hook useEffect has a missing dependency 해결
  // 의존성 배열에 handleDrag, handleDragEnd 추가 하기 위해 useCallback 적용
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  return (
    <div>
      <h3 className="mb-2">데이터 분할 비율</h3>
      <div className="relative">
        {/* 드래그 가능한 분할 막대 */}
        <div ref={containerRef} className="relative mt-4 mb-6 h-10 w-full overflow-hidden rounded-md">
          {/* 학습 데이터 섹션 */}
          <div className="absolute top-0 left-0 flex h-full items-center justify-center bg-[var(--color-primary)]" style={{ width: `${dataSplit}%` }}>
            <span className="z-10 text-sm font-medium text-[var(--color-primary-foreground)]">{dataSplit}%</span>
          </div>

          {/* 검증 데이터 섹션 */}
          <div
            className="absolute flex h-full items-center justify-center bg-[var(--color-yellow-01)]"
            style={{
              left: `${dataSplit}%`,
              width: `${Math.floor((100 - dataSplit) * 0.7)}%`,
            }}
          >
            <span className="z-10 text-sm font-medium text-[var(--primary-black)]">{Math.floor((100 - dataSplit) * 0.7)}%</span>
          </div>

          {/* 테스트 데이터 섹션 */}
          <div
            className="absolute right-0 flex h-full items-center justify-center bg-[var(--color-blue-01)]"
            style={{
              width: `${100 - dataSplit - Math.floor((100 - dataSplit) * 0.7)}%`,
            }}
          >
            <span className="z-10 text-sm font-medium text-[var(--color-primary-foreground)]">{100 - dataSplit - Math.floor((100 - dataSplit) * 0.7)}%</span>
          </div>

          {/* 드래그 핸들 */}
          <div
            className="absolute top-0 z-20 h-full w-4 cursor-col-resize"
            style={{
              left: `calc(${dataSplit}% - 2px)`,
              backgroundColor: 'transparent',
            }}
            onMouseDown={handleDragStart}
          >
            <div className="absolute top-0 left-1/2 h-full w-1 -translate-x-1/2 bg-white"></div>
          </div>
        </div>

        {/* 라벨 섹션 */}
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className="mr-1 h-4 w-4 rounded-full bg-[var(--color-primary)]"></div>
            <span className="text-xs">학습데이터</span>
          </div>
          <div className="flex items-center">
            <div className="mr-1 h-4 w-4 rounded-full bg-[var(--color-yellow-01)]"></div>
            <span className="text-xs">검증데이터</span>
          </div>
          <div className="flex items-center">
            <div className="mr-1 h-4 w-4 rounded-full bg-[var(--color-blue-01)]"></div>
            <span className="text-xs">테스트데이터</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSplitControl;
