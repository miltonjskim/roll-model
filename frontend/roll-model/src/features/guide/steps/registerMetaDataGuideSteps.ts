import { guide } from '@/features/guide/GuideProvider';

export const registerMetaDataGuideSteps = () => {
  guide.addStep({
    id: 'intro',
    title: '<span class="font-tossface">👋</span> 프로젝트 시작을 도와드릴게요!',
    text: `지금부터 <b>프로젝트 기본 정보</b>를 설정할 거예요.<br/>
    이름, 예측 목표, 도메인 등을 차근차근 입력하면<br/>
    나만의 AI 프로젝트가 시작됩니다!`,
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
    id: 'project-title',
    title: '<span class="font-tossface">📁 </span> 프로젝트 이름',
    text: `사용할 프로젝트의 이름을 정해주세요.<br/>나중에 쉽게 구분할 수 있도록 직관적인 이름이 좋아요.`,
    attachTo: {
      element: '.guide-project-title',
      on: 'bottom',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      {
        text: '다음',
        classes: 'shepherd-button black',
        action: guide.next,
      },
    ],
    classes: 'shepherd-rounded',
  });

  guide.addStep({
    id: 'project-description',
    title: '<span class="font-tossface">🎯</span> 예측 목적',
    text: `이 프로젝트의 <b>목표 변수</b>를 입력해주세요.<br/>예: 매출, 이탈률, 질병 유무 등`,
    attachTo: {
      element: '.guide-project-description',
      on: 'bottom',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      {
        text: '이전',
        classes: 'shepherd-button outline',
        action: guide.back,
      },
      {
        text: '다음',
        classes: 'shepherd-button black',
        action: guide.next,
      },
    ],
  });

  guide.addStep({
    id: 'project-domain',
    title: '<span class="font-tossface">🌐 </span> 도메인 선택',
    text: `어떤 산업/분야에 해당하는 프로젝트인지 선택해주세요.<br/>선택한 도메인에 따라 추천 기능이 달라질 수 있어요.`,
    attachTo: {
      element: '.guide-project-domain',
      on: 'bottom',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      {
        text: '이전',
        classes: 'shepherd-button outline',
        action: guide.back,
      },
      {
        text: '다음',
        classes: 'shepherd-button black',
        action: guide.next,
      },
    ],
  });
  guide.addStep({
    id: 'project-type',
    title: '<span class="font-tossface">🧠 </span> 예측 방식 선택',
    text: `
      <b>예측하려는 값의 종류</b>에 따라 아래 중 하나를 선택해주세요.<br/><br/>
      <b>📊 분류 (Classification)</b>은 결과가 <u>범주형(카테고리)</u>일 때 사용합니다.<br/>
      예: 스팸 여부, 질병 유무, 고객 이탈 여부 등<br/><br/>
      <b>📈 회귀 (Regression)</b>은 결과가 <u>숫자</u>일 때 사용합니다.<br/>
      예: 매출 예측, 체온 예측, 주가 예측 등
    `,
    attachTo: {
      element: '.guide-project-type',
      on: 'bottom',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      {
        text: '이전',
        classes: 'shepherd-button outline',
        action: guide.back,
      },
      {
        text: '다음',
        classes: 'shepherd-button black',
        action: guide.next,
      },
    ],
  });

  guide.addStep({
    id: 'project-public',
    title: '<span class="font-tossface">🔓 </span> 공개 여부 설정',
    text: `이 프로젝트를 다른 사람들과 공유할 수 있도록 <b>공개 여부</b>를 설정할 수 있어요.`,
    attachTo: {
      element: '.guide-project-public',
      on: 'top',
    },
    highlightClass: 'shepherd-highlight',
    buttons: [
      {
        text: '이전',
        classes: 'shepherd-button outline',
        action: guide.back,
      },
      {
        text: '가이드 종료',
        classes: 'shepherd-button black',
        action: guide.complete,
      },
    ],
  });
};
