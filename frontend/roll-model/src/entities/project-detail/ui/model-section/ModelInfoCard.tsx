'use client';

import { ModelParameter, TargetInfo } from '@/entities/project-detail/model/ModelTypes';
import { CLASSIFICATION_MODELS, REGRESSION_MODELS } from '@/shared/api/mocks/modeling/modelingData';
import { MdBubbleChart } from 'react-icons/md';
import { FaSearch } from 'react-icons/fa';
import { IoExtensionPuzzle } from 'react-icons/io5';
import { MdTimer } from 'react-icons/md';
import confetti from 'canvas-confetti';
import { useRef, useState } from 'react';
import { ModelEmoji, getModelEmoji, getParameterEmoji, getCommonParamEmoji } from '@/shared/api/mocks/modeling/modelingEmoji';
import { CssDetailHovering } from '@/widgets/project/project-detail/ProjectDetailCard';

interface ModelInfoCardProps {
  category: string;
  algorithmName: string;
  koreanModelName: string;
  modelParameters: ModelParameter[];
  targetInfo: TargetInfo[];
}

export default function ModelInfoCard({ category, algorithmName, koreanModelName, modelParameters, targetInfo }: ModelInfoCardProps) {
  // confetti
  const iconRef = useRef<HTMLDivElement>(null);
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  // 모델 설명 찾기
  const modelInfo = category === 'CLASSIFICATION' ? CLASSIFICATION_MODELS.find((model) => model.id === algorithmName) : REGRESSION_MODELS.find((model) => model.id === algorithmName);
  const description = modelInfo?.description;

  // confetti 트리거 함수
  const triggerConfetti = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isConfettiActive || !iconRef.current) return;

    setIsConfettiActive(true);

    const iconElement = iconRef.current;
    const rect = iconElement.getBoundingClientRect();

    // 아이콘의 중앙을 기준으로 confetti 생성
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight + 0.05;

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { x, y },
      disableForReducedMotion: true,
      zIndex: 1000,
      colors: ['#ffb6c1', '#add8e6', '#90ee90', '#ffffe0', '#e6e6fa'],
      shapes: ['circle', 'square'],
      ticks: 80,
      scalar: 0.5,
      startVelocity: 8,
      gravity: 0.3,
    });

    setTimeout(() => {
      setIsConfettiActive(false);
    }, 2000);
  };

  // 이름 속 괄호제거
  const formatParamName = (name: string) => {
    if (!name) return '-';
    return name.split('(')[0].trim();
  };

  return (
    <div>
      <header className="flex justify-between">
        {/* 모델명 */}
        <h2 className={`mb-2 text-start text-lg font-semibold`}>
          <span className="text-[theme(color-muted-foreground)] mb-2 text-sm">모델: </span> {koreanModelName}
        </h2>
        <div>
          {/* 오른쪽 모델명 */}
          <div className="bg-[theme(primary-black)] rounded-sm px-4 py-1 text-sm font-medium text-white">{algorithmName}</div>
        </div>
      </header>
      <center className="flex items-center justify-between gap-8">
        {/* 아이콘 영역 */}
        <div className={`bg-[theme(primary-black)] border-[theme(color-gray-02)] flex h-[9rem] w-[9rem] items-center justify-center overflow-hidden rounded-lg border border-3 select-none`}>
          <div className={`flex w-full cursor-pointer justify-center rounded-lg text-[5rem] transition-all duration-600 hover:text-[5.5rem]`} onClick={triggerConfetti} ref={iconRef}>
            {getModelEmoji(algorithmName)}
          </div>
        </div>
        {/* 오른쪽 */}
        <div className="flex w-full flex-col justify-between">
          {/* 중간설명 한줄 */}
          <div className="flex w-full items-start justify-between">
            <p className={`text-[theme(color-muted-foreground)] mb-3 text-start text-sm`}>
              {category === 'CLASSIFICATION' ? '분류' : '회귀'} 모델 : {description}
            </p>
          </div>

          {/* 카드 영역*/}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 첫 번째 카드 */}
            <div className={`bg-[theme(color-blue-03)] hover:bg-[theme(color-blue-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
              <div className="flex flex-col">
                <div className="h-[2rem] text-start text-sm text-gray-500">{formatParamName(modelParameters[0]?.parameterName) || '-'}</div>
                <div className="text-start text-xl font-bold lg:text-3xl">{modelParameters[0]?.parameterValue || '-'}</div>
              </div>
              <div className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">{modelParameters[0]?.parameterKey && getParameterEmoji(algorithmName, modelParameters[0].parameterKey)}</div>
            </div>

            {/* 두 번째 카드 */}
            <div className={`bg-[theme(color-yellow-03)] hover:bg-[theme(color-yellow-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
              <div className="flex flex-col">
                <div className="h-[2rem] text-start text-sm text-gray-500">{formatParamName(modelParameters[1]?.parameterName) || '-'}</div>
                <div className="text-start text-xl font-bold lg:text-3xl">{modelParameters[1]?.parameterValue || '-'}</div>
              </div>
              <div className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">{modelParameters[1]?.parameterKey && getParameterEmoji(algorithmName, modelParameters[1].parameterKey)}</div>
            </div>

            {/* 세 번째 카드 */}
            <div className={`bg-[theme(color-green-03)] hover:bg-[theme(color-green-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
              <div className="flex flex-col">
                <div className="h-[2rem] text-start text-sm text-gray-500">{targetInfo[0]?.targetName || '특성 수'}</div>
                <div className="text-start text-xl font-bold lg:text-3xl">{targetInfo[0]?.targetValue || '-'}</div>
              </div>
              <div className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">{getCommonParamEmoji('feature_count')}</div>
            </div>

            {/* 네 번째 카드 */}
            <div className={`bg-[theme(color-rose-03)] hover:bg-[theme(color-rose-04)] flex justify-between rounded-lg p-3 ${CssDetailHovering} hover:shadow-lg`}>
              <div className="flex flex-col">
                <div className="h-[2rem] text-start text-sm text-gray-500">{targetInfo[1]?.durationName || '학습 시간'}</div>
                <div className="text-start text-xl font-bold lg:text-3xl">{targetInfo[1]?.durationValue ? `${Math.round(Number(targetInfo[1].durationValue) * 1000).toLocaleString()} ms` : '-'}</div>
              </div>
              <div className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">{getCommonParamEmoji('training_time')}</div>
            </div>
          </div>
        </div>
      </center>
    </div>
  );
}
