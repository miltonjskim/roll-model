import { guide } from '@/features/guide/GuideProvider';

export const registerInitProjectSteps = () => {
  guide.addStep({
    id: 'step-1',
    text: '만들어뒀던 모델 말고, 새로운 데이터로 새로운 모델을 만들게 됩니다.',
    attachTo: {
      element: '.add-project-btn',
      on: 'top',
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
    text: '님이 최근에 만들어뒀던 프로젝트를 재학습 할거에요.',
    attachTo: {
      element: '.retrain-project-btn',
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
