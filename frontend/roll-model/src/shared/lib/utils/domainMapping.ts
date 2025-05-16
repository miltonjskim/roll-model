export type ApiProjectDomain = 'FINANCE' | 'HEALTHCARE' | 'RETAIL' | 'MARKETING' | 'MANUFACTURING' | 'EDUCATION' | 'REAL_ESTATE' | 'LOGISTICS' | 'ENTERTAINMENT' | 'GENERAL';

export type DisplayProjectDomain = string; // 화면에 표시할 한글 도메인

export const DOMAIN_DISPLAY_MAP: Record<ApiProjectDomain, DisplayProjectDomain> = {
  FINANCE: '금융/핀테크',
  HEALTHCARE: '의료/헬스케어',
  RETAIL: '소매/이커머스',
  MARKETING: '마케팅/광고',
  MANUFACTURING: '제조/산업',
  EDUCATION: '교육/학습',
  REAL_ESTATE: '부동산/건설',
  LOGISTICS: '운송/물류',
  ENTERTAINMENT: '콘텐츠/미디어',
  GENERAL: '일반',
};

//API에서 받은 도메인 값을 화면 표시용 한글 도메인으로 변환
export const getDomainDisplayName = (apiDomain: ApiProjectDomain): DisplayProjectDomain => {
  return DOMAIN_DISPLAY_MAP[apiDomain] || '알 수 없음';
};
