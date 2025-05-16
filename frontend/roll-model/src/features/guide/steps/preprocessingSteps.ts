import { guide } from '@/features/guide/GuideProvider';

export const registerPreprocessingSteps = () => {
  guide.addStep({
    id: 'step-1',
    text: '여기서 전처리 옵션을 선택할 수 있어요!',
    attachTo: {
      element: '.preprocessing-options', // DOM element (클래스명 기준)
      on: 'right',
    },
    buttons: [
      {
        text: '다음',
        action: guide.next,
      },
    ],
  });

  guide.addStep({
    id: 'step-2',
    text: '이건 AI 추천 결과예요!',
    attachTo: {
      element: '.ai-recommended-section',
      on: 'top',
    },
    buttons: [
      {
        text: '이전',
        action: guide.back,
      },
      {
        text: '종료',
        action: guide.complete,
      },
    ],
  });
};
