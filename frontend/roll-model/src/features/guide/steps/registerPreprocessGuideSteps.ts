import { guide } from '@/features/guide/GuideProvider';

export const registerPreprocessGuideSteps = () => {
  guide.addStep({
    id: 'intro',
    title: '<span class="font-tossface">📦</span> 전처리 단계 시작!',
    text: `업로드한 데이터를 바탕으로 <b>전처리 작업</b>을 진행할 수 있어요.<br/>
    AI 추천부터 결측치/이상치 처리, 인코딩까지<br/>
    필요한 작업을 하나씩 선택해보세요.`,
    classes: 'bg-white shadow-xl rounded-md border border-gray-200 text-gray-900 max-w-md px-4 py-3',
    highlightClass: 'shepherd-highlight',
    buttons: [
      {
        text: '다시 보지 않기',
        classes: `shepherd-button outline text-xs text-red-500 border-red-200 hover:bg-red-50`,
        action: () => {
          localStorage.setItem('guide.dismissed', 'true');
          guide.cancel();
        },
      },
      {
        text: '좋아요! 다음 단계',
        classes: `shepherd-button black text-xs`,
        action: guide.next,
      },
    ],
  });

  guide.addStep({
    id: 'preprocessing-option-area',
    title: '<span class="font-tossface">🛠️</span> 전처리 기능 선택',
    text: `여기에서 <b>결측치, 이상치, 인코딩 등</b> 다양한 전처리 기능을 적용할 수 있어요.`,
    attachTo: {
      element: '.preprocessing-options',
      on: 'right',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [{ text: '다음', classes: 'shepherd-button black', action: guide.next }],
  });

  guide.addStep({
    id: 'data-summary-area',
    title: '<span class="font-tossface">📝</span> 데이터 요약 한눈에 보기',
    text: `여기에서 결측치가 있는 컬럼과 행, 비율 등을 확인할 수 있어요.`,
    attachTo: {
      element: '.data-summary-area',
      on: 'right',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [{ text: '다음', classes: 'shepherd-button black', action: guide.next }],
  });

  guide.addStep({
    id: 'ai-recommended-section',
    title: '<span class="font-tossface">🤖</span> AI 추천 전처리',
    text: `AI가 자동으로 추천한 전처리 단계를 보여줘요.<br/>마음에 들면 그대로 적용하거나 참고해서 추가할 수 있어요.`,
    attachTo: {
      element: '.ai-recommended-section',
      on: 'left',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      { text: '이전', classes: 'shepherd-button outline', action: guide.back },
      { text: '다음', classes: 'shepherd-button black', action: guide.next },
    ],
  });

  guide.addStep({
    id: 'preprocessing-table',
    title: '<span class="font-tossface">📊</span> 데이터 미리보기',
    text: `이곳에서 전처리된 데이터를 <b>실제로 확인</b>할 수 있어요.<br/>변경된 셀은 노란색으로 표시됩니다.`,
    attachTo: {
      element: '.preprocessing-table',
      on: 'top',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      { text: '이전', classes: 'shepherd-button outline', action: guide.back },
      { text: '다음', classes: 'shepherd-button black', action: guide.next },
    ],
  });

  guide.addStep({
    id: 'applied-steps',
    title: '<span class="font-tossface">📚</span> 적용한 전처리 단계',
    text: `사용자가 직접 선택한 전처리 단계를 <b>순서대로 기록</b>해줘요.<br/>실수해도 마지막 단계를 삭제할 수 있어요.`,
    attachTo: {
      element: '.applied-steps',
      on: 'top',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      { text: '이전', classes: 'shepherd-button outline', action: guide.back },
      { text: '다음', classes: 'shepherd-button black', action: guide.next },
    ],
  });

  guide.addStep({
    id: 'submit-button',
    title: '<span class="font-tossface">✅</span> 전처리 완료하기',
    text: `모든 설정이 끝났다면 <b>이 버튼을 눌러 전처리를 마무리</b>하세요.`,
    attachTo: {
      element: '.complete-button',
      on: 'top',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      { text: '이전', classes: 'shepherd-button outline', action: guide.back },
      { text: '가이드 종료', classes: 'shepherd-button black', action: guide.complete },
    ],
  });
};
