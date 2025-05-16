import { guide } from '@/features/guide/GuideProvider';

export const registerInitProjectSteps = () => {
  guide.addStep({
    id: 'intro',
    title: '<span class="font-tossface">👋</span> 반가워요!',
    text: `이곳에서 <b>새 프로젝트를 만들고 데이터를 업로드</b>할 수 있어요.<br/>간단하게 데이터셋만 올리면 바로 시작할 수 있답니다.`,
    attachTo: {
      element: '.upload-section',
      on: 'bottom',
    },
    classes: 'bg-white shadow-xl rounded-md border border-gray-200 text-gray-900 max-w-md px-4 py-3',
    buttons: [
      {
        text: '다시 보지 않기',
        classes: 'text-xs text-red-500 mr-2',
        action: () => {
          localStorage.setItem('guide.dismissed', 'true');
          guide.cancel();
        },
      },
      {
        text: '좋아요! 다음 단계',
        classes: 'text-xs btn btn-primary',
        action: guide.next,
      },
    ],
  });

  guide.addStep({
    id: 'step-1',
    title: '<span class="font-tossface">🆕</span> 새 모델 만들기',
    text: `여기서 <b>완전히 새로운 데이터로</b> 모델을 만들 수 있어요.<br/>처음부터 새로 시작하고 싶다면 이 버튼을 클릭해보세요.`,
    attachTo: {
      element: '.add-project-btn',
      on: 'top',
    },
    buttons: [
      {
        text: '다음으로',
        action: guide.next,
      },
    ],
  });

  guide.addStep({
    id: 'step-2',
    title: '<span class="font-tossface">🔁</span> 프로젝트 재학습',
    text: `이전 프로젝트를 <b>빠르게 다시 학습</b>할 수 있어요.<br/>정제된 데이터만 있으면 바로 학습 가능합니다!`,
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
        text: '가이드 종료',
        action: guide.complete,
      },
    ],
  });
};
