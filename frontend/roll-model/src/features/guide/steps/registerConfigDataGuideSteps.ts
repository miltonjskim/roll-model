import { guide } from '@/features/guide/GuideProvider';

export const registerConfigDataGuideSteps = () => {
  guide.addStep({
    id: 'intro',
    title: '<span class="font-tossface">👋</span> 데이터 준비를 시작해요!',
    text: `업로드한 파일을 AI가 이해할 수 있도록<br/><b>컬럼명, 구분자, 인코딩</b> 등을 설정하는 단계예요.<br/>한 번만 설정하면 이후 분석이 훨씬 쉬워져요!`,
    classes: 'bg-white shadow-xl rounded-md border border-gray-200 text-gray-900 max-w-md px-4 py-3 shepherd-step-intro',
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
    id: 'header-toggle',
    title: '<span class="font-tossface">🧾</span> 첫 줄을 컬럼명으로 쓸까요?',
    text: `보통 CSV의 <b>첫 번째 줄</b>은 컬럼명을 담고 있어요.<br/>이 옵션을 켜면 데이터의 구조가 더 명확해져요.`,
    classes: 'shepherd-step-1',
    attachTo: { element: '.guide-header-toggle', on: 'top' },
    highlightClass: 'shepherd-highlight',
    buttons: [{ text: '다음', classes: 'shepherd-button black', action: guide.next }],
  });

  guide.addStep({
    id: 'column-header-edit',
    title: '<span class="font-tossface">✏️</span> 컬럼 이름 정리하기',
    text: `자동 생성된 <code>col1</code>, <code>col2</code> 같은 이름은<br/>분석할 때 헷갈릴 수 있어요. <b>직접 수정해 보세요!</b>`,
    classes: 'shepherd-step-2',
    attachTo: { element: '.guide-header-edit', on: 'top' },
    highlightClass: 'shepherd-highlight',
    buttons: [
      { text: '이전', classes: 'shepherd-button outline', action: guide.back },
      { text: '다음', classes: 'shepherd-button black', action: guide.next },
    ],
  });

  guide.addStep({
    id: 'column-type-select',
    title: '<span class="font-tossface">🔧</span> 컬럼 타입 선택',
    text: `숫자, 문자, 날짜처럼<br/><b>컬럼의 데이터 종류</b>를 알려주세요.<br/>정확한 분석을 위해 꼭 필요한 작업이에요.`,
    classes: 'shepherd-step-1',
    attachTo: { element: '.guide-column-type', on: 'top' },
    highlightClass: 'shepherd-highlight',
    buttons: [
      { text: '이전', classes: 'shepherd-button outline', action: guide.back },
      { text: '다음', classes: 'shepherd-button black', action: guide.next },
    ],
  });

  guide.addStep({
    id: 'delimiter-select',
    title: '<span class="font-tossface">🔣</span> 구분자 확인하기',
    text: `CSV 파일은 각 열을 쉼표(,)나 탭으로 구분해요.<br/>데이터가 잘 나뉘지 않는다면 <b>다른 구분자</b>를 선택해보세요.`,
    classes: 'shepherd-step-2',
    attachTo: { element: '.guide-delimiter-select', on: 'top' },
    highlightClass: 'shepherd-highlight',
    buttons: [
      { text: '이전', classes: 'shepherd-button outline', action: guide.back },
      { text: '다음', classes: 'shepherd-button black', action: guide.next },
    ],
  });

  guide.addStep({
    id: 'encoding-select',
    title: '<span class="font-tossface">🧾</span> 글자가 깨졌나요?',
    text: `파일 인코딩이 다르면 <b>한글이 깨질 수 있어요</b>.<br/><code>UTF-8</code> 또는 <code>EUC-KR</code>로 바꿔보세요.`,
    classes: 'shepherd-step-1',
    attachTo: { element: '.guide-encoding-select', on: 'top' },
    highlightClass: 'shepherd-highlight',
    buttons: [
      { text: '이전', classes: 'shepherd-button outline', action: guide.back },
      { text: '가이드 종료', classes: 'shepherd-button black', action: guide.complete },
    ],
  });
};
