// 모델 관련 이모지 모음
export const ModelEmoji = {
  // 모델 타입별 이모지
  CLASSIFICATION: '🏷️',
  REGRESSION: '📈',

  // 분류 모델
  LogisticRegression: {
    name: '로지스틱 회귀 (Logistic Regression)',
    emoji: ['📊', '🔄', '🎢', '🦓'],
    parameters: {
      penalty: ['🔗', '🔒'], // 규제 유형
      C: ['💪', '🔧'], // 규제 강도
      solver: ['🧮', '🔄'], // 최적화 알고리즘
      max_iter: ['🔁', '🔢'], // 반복 횟수
    },
  },
  SVC: {
    name: '서포트 벡터 머신 (SVC)',
    emoji: ['🛡️', '✂️', '🥊', '🍳'],
    parameters: {
      C: ['💢', '🎚️'], // 마진 오류 패널티
      kernel: ['🌀', '🧠'], // 커널 함수
      gamma: ['📊', '🔍'], // 감마 값
      degree: ['📏', '📐'], // 다항 차수
    },
  },
  KNeighborsClassifier: {
    name: 'K-최근접 이웃 (KNN)',
    emoji: ['🏘️', '📍', '🕵️', '🐑'],
    parameters: {
      n_neighbors: ['👥', '🏘️'], // 이웃 개수
      weights: ['⚖️', '📏'], // 거리 가중치
      metric: ['📐', '🔢'], // 거리 측정 방식
    },
  },
  RandomForestClassifier: {
    name: '랜덤 포레스트 (Random Forest)',
    emoji: ['🌲', '🌳', '🎄', '🎲'],
    parameters: {
      n_estimators: ['🌲', '🔢'], // 결정 트리 개수
      max_depth: ['📊', '🕳️'], // 최대 깊이
      max_features: ['🎯', '📋'], // 최대 특성 수
    },
  },
  GradientBoostingClassifier: {
    name: '그래디언트 부스팅 (Gradient Boosting)',
    emoji: ['🚀', '📈', '🦸', '🪜'],
    parameters: {
      n_estimators: ['🚀', '📶'], // 부스팅 단계 수
      learning_rate: ['🐢', '🐇'], // 학습률
      max_depth: ['📊', '🔍'], // 최대 깊이
    },
  },

  // 회귀 모델
  ElasticNet: {
    name: '엘라스틱넷 (ElasticNet)',
    emoji: ['🕸️', '🔗', '🧦'],
    parameters: {
      alpha: ['🔐', '📉'], // 전체 정규화 강도
      l1_ratio: ['🧩', '⚖️'], // L1/L2 비율
    },
  },
  SVR: {
    name: '서포트 벡터 회귀 (SVR)',
    emoji: ['📉', '🎯'],
    parameters: {
      C: ['🎯', '🔍'], // 마진 오류 허용도
      epsilon: ['📏', '🔎'], // 오류 허용 범위
      kernel: ['🌀', '🧠'], // 커널 종류
    },
  },
  RandomForestRegressor: {
    name: '랜덤 포레스트 회귀 (Random Forest)',
    emoji: ['🌿', '🌴', '🌵'],
    parameters: {
      n_estimators: ['🌲', '🔢'], // 트리 개수
      max_depth: ['📊', '🕳️'], // 트리 깊이 제한
      max_features: ['🎯', '📋'], // 분할 시 사용할 특성 수
    },
  },
  GradientBoostingRegressor: {
    name: '그래디언트 부스팅 회귀 (Gradient Boosting)',
    emoji: ['⚡', '🔥', '🧩'],
    parameters: {
      n_estimators: ['🚀', '📶'], // 부스팅 단계 수
      learning_rate: ['🐢', '🐇'], // 각 단계 기여도
      max_depth: ['📊', '🔍'], // 개별 트리 복잡도
    },
  },

  // 공통 모델 파라미터
  CommonParams: {
    feature_count: ['🧩', '🧮', '🧪'], // 특성 수
    training_time: ['⏱️', '⏳', '🕒'], // 학습 시간
  },

  // 평가 지표
  Metrics: {
    // 분류 평가 지표
    Classification: {
      accuracy: ['🎯', '🎖️', '🎪'], // 정확도
      precision: ['🔍', '🧐', '📌'], // 정밀도
      recall: ['🕸️', '🔍', '🧲'], // 재현율
      f1_score: ['⚖️', '🏆', '📊'], // F1 점수
    },
    // 회귀 평가 지표
    Regression: {
      r_squared: ['📏', '🎯', '📐'], // 결정계수
      mae: ['↔️', '📉', '📊'], // 평균 절대 오차
      mse: ['📊', '🔄', '📉'], // 평균 제곱 오차
      rmse: ['📉', '📐', '🧮'], // 평균 제곱근 오차
    },
  },
};

// 모델 선택 시 사용할 이모지 (첫 번째 이모지 사용)
export const getModelEmoji = (modelId: string): string => {
  // ModelEmoji 객체 내의 모델 타입 확인
  const model = ModelEmoji[modelId as keyof typeof ModelEmoji];
  // 객체이고 emoji 속성이 있는지 확인
  if (model && typeof model === 'object' && 'emoji' in model && Array.isArray(model.emoji) && model.emoji.length > 0) {
    return model.emoji[0];
  }
  return '🤖'; // 기본 이모지
};

// 모델 타입에 따른 이모지 반환
export const getModelTypeEmoji = (type: 'CLASSIFICATION' | 'REGRESSION'): string => {
  return ModelEmoji[type];
};

// 평가 지표 이모지 반환
export const getMetricEmoji = (metric: string, type: 'CLASSIFICATION' | 'REGRESSION'): string => {
  const metrics = type === 'CLASSIFICATION' ? ModelEmoji.Metrics.Classification : ModelEmoji.Metrics.Regression;

  // Record<string, string[]>로 타입 단언
  const metricsRecord = metrics as Record<string, string[]>;
  const metricKey = metric.toLowerCase();

  if (metricKey in metricsRecord && Array.isArray(metricsRecord[metricKey]) && metricsRecord[metricKey].length > 0) {
    return metricsRecord[metricKey][0];
  }
  return '📊'; // 기본 이모지
};

// 파라미터 이모지 반환
export const getParameterEmoji = (modelId: string, paramId: string): string => {
  const model = ModelEmoji[modelId as keyof typeof ModelEmoji];

  // 모델이 객체이고 parameters 속성이 있는지 확인
  if (model && typeof model === 'object' && 'parameters' in model) {
    // parameters 객체 내에 paramId가 있는지 확인
    const parameters = model.parameters as Record<string, string[]>;
    if (parameters && paramId in parameters && Array.isArray(parameters[paramId]) && parameters[paramId].length > 0) {
      return parameters[paramId][0];
    }
  }

  return '🔧'; // 기본 이모지
};

// 공통 파라미터 이모지 반환
export const getCommonParamEmoji = (paramName: 'feature_count' | 'training_time'): string => {
  return ModelEmoji.CommonParams[paramName][0];
};
