import { DataSplit } from '@/entities/project-detail/model/dataTypes';
import { CssDetailHoveringLittle } from '@/widgets/project/project-detail/ProjectDetailCard';
import { useState, useRef, useEffect } from 'react';

interface DataSplitCardProps {
  dataSplit: DataSplit;
}

export const DataSplitCard = ({ dataSplit }: DataSplitCardProps) => {
  const { method, trainRatio, testRatio, validationRatio } = dataSplit;

  // 드래그 상태 관리
  const [isDragging, setIsDragging] = useState(false);
  const [tempTrainRatio, setTempTrainRatio] = useState(trainRatio);
  const [tempValidationRatio, setTempValidationRatio] = useState(validationRatio);
  const [tempTestRatio, setTempTestRatio] = useState(testRatio);

  const containerRef = useRef<HTMLDivElement>(null);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // 드래그 중
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // 마우스 위치를 비율로 변환 (0~1 사이)
    let newTrainRatio = Math.max(0.1, Math.min(0.9, x / width));

    // 검증 데이터가 있는 경우 두 번째 경계선도 처리
    if (validationRatio > 0) {
      // 훈련 데이터와 검증 데이터의 합계 비율 계산
      const combinedRatio = trainRatio + validationRatio;

      // 검증 데이터 비율이 최소한 유지되도록 조정
      if (newTrainRatio > combinedRatio - 0.1) {
        newTrainRatio = combinedRatio - 0.1;
      }

      // 나머지 비율을 검증과 테스트 데이터로 분배
      const newValidationRatio = combinedRatio - newTrainRatio;

      setTempTrainRatio(newTrainRatio);
      setTempValidationRatio(newValidationRatio);
      setTempTestRatio(1 - newTrainRatio - newValidationRatio);
    } else {
      // 검증 데이터가 없는 경우 간단히 처리
      setTempTrainRatio(newTrainRatio);
      setTempTestRatio(1 - newTrainRatio);
    }
  };

  // 드래그 종료
  const handleMouseUp = () => {
    if (isDragging) {
      // 원래 비율로 복원
      setTempTrainRatio(trainRatio);
      setTempValidationRatio(validationRatio);
      setTempTestRatio(testRatio);
      setIsDragging(false);
    }
  };

  // 전역 이벤트 리스너 설정 및 정리
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 현재 표시할 비율 (드래그 중이면 임시 비율, 아니면 원래 비율)
  const displayTrainRatio = isDragging ? tempTrainRatio : trainRatio;
  const displayValidationRatio = isDragging ? tempValidationRatio : validationRatio;
  const displayTestRatio = isDragging ? tempTestRatio : testRatio;

  return (
    <div className={`bg-[theme(color-card-background)] border-[theme(color-gray-05)] mb-4 rounded-lg border px-4 pt-2 shadow-sm ${CssDetailHoveringLittle}`}>
      <div className="mb-2">
        <span className="text-[theme(color-muted-foreground)] text-sm">분할 방법: </span>
        <span className="font-medium">{getSplitMethodName(method)}</span>
      </div>

      <div ref={containerRef} className="bg-[theme(color-muted)] bg-[theme(color-rose-01)] relative h-12 w-full overflow-hidden rounded-md">
        <div className="flex h-full">
          <div
            className={`bg-[theme(color-blue-01)] flex h-full items-center justify-center rounded-md ${isDragging ? 'transition-none' : 'transition-all duration-300'}`}
            style={{ width: `${displayTrainRatio * 100}%` }}
          >
            <span className="text-[theme(primary-white)] text-xs font-medium">훈련 {(displayTrainRatio * 100).toFixed(0)}%</span>
          </div>

          {displayValidationRatio > 0 && (
            <div
              className={`bg-[theme(color-green-01)] flex h-full items-center justify-center ${isDragging ? 'transition-none' : 'transition-all duration-300'}`}
              style={{ width: `${displayValidationRatio * 100}%` }}
            >
              <span className="text-[theme(primary-white)] text-xs font-medium">검증 {(displayValidationRatio * 100).toFixed(0)}%</span>
            </div>
          )}

          <div
            className={`bg-[theme(color-rose-01)] flex h-full items-center justify-center ${isDragging ? 'transition-none' : 'transition-all duration-300'}`}
            style={{ width: `${displayTestRatio * 100}%` }}
          >
            <span className="text-[theme(primary-white)] text-xs font-medium">테스트 {(displayTestRatio * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* 드래그 핸들 */}
        <div
          className={`border-[theme(primary-white)] absolute top-0 bottom-0 w-4 cursor-ew-resize border border-3 opacity-50 hover:opacity-80 ${isDragging ? 'opacity-80' : ''}`}
          style={{ left: `calc(${displayTrainRatio * 100}% - 8px)` }}
          onMouseDown={handleMouseDown}
        />

        {validationRatio > 0 && (
          <div
            className={`absolute top-0 bottom-0 w-1 cursor-ew-resize bg-white opacity-50 hover:opacity-80 ${isDragging ? 'opacity-80' : ''}`}
            style={{ left: `calc(${(displayTrainRatio + displayValidationRatio) * 100}% - 2px)` }}
          />
        )}
      </div>

      <div className="text-[theme(color-muted-foreground)] mt-2 h-[2rem] text-xs">* 마우스를 놓으면 원래 비율로 돌아갑니다.</div>
    </div>
  );
};

// 분할 방법 이름 변환
const getSplitMethodName = (method: string): string => {
  const methodMap: Record<string, string> = {
    RANDOM: '랜덤 분할',
    STRATIFIED: '계층적 분할',
    TIME_SERIES: '시계열 분할',
  };

  return methodMap[method] || method;
};
