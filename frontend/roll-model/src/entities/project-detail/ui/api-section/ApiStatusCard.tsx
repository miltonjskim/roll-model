import { ApiStatus } from '@/entities/project-detail/model/ApiTypes';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { CssDetailHovering } from '@/widgets/project/project-detail/ProjectDetailCard';
import axios from 'axios';
import { useState, useEffect } from 'react';

interface ApiStatusCardProps {
  apiStatus: ApiStatus;
  endpoint?: string;
  inputSchema?: any;
  apiKey: string;
}

interface Feature {
  name: string;
  type: string;
  required: boolean;
  example: number | string | boolean;
  options: string[] | null;
}

export default function ApiStatusCard({ apiStatus, endpoint, inputSchema, apiKey }: ApiStatusCardProps) {
  const [apiActiveStatus, setApiActiveStatus] = useState<{
    isActive: boolean;
    performance: number;
    isChecking: boolean;
  }>({
    isActive: false,
    performance: 0,
    isChecking: false,
  });

  // API 상태 체크 함수
  const checkApiStatus = async () => {
    if (!endpoint || !inputSchema) return;

    setApiActiveStatus((prev) => ({ ...prev, isChecking: true }));

    const startTime = Date.now();

    try {
      // 프록시 적용 전
      // const apiEndpoint = endpoint.endsWith(':predict') ? endpoint : `${endpoint}:predict`;

      // 프록시 적용
      const modelId = endpoint.split('/').pop(); // 'model-681dc05b94fed8acc6f1dc6d' 추출
      // const apiEndpoint = `/api/model/${modelId}${endpoint.endsWith(':predict') ? '' : ':predict'}`;
      const apiEndpoint = `/api/model/${modelId}`;
      // const apiEndpoint = endpoint;

      const exampleValues = inputSchema.features.map((feature: Feature) => feature.example);

      // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 테스트 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
      // 요청 본문 생성 (테스트할때 여기주석하고)
      const requestBody = {
        inputs: [exampleValues],
      };
      // 681dc05b94fed8acc6f1dc6d (url 파이프라인 id 바꾸고)
      // 테스트 바디 (주석풀고)
      // const requestBody = {
      //   inputs: [[1513.56, 4, 493, 3.1, 4.5, 30.9]],
      // };
      // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

      // POST 요청 보내기
      console.log('요청 가보자', apiEndpoint, '그리고', requestBody);

      const response = await axios.post(apiEndpoint, requestBody, {
        headers: {
          apiKey: apiKey,
          'Content-Type': 'application/json',
        },
      });

      // 응답 시간 계산
      const responseTime = Date.now() - startTime;

      setApiActiveStatus({
        isActive: response.status === 200,
        performance: responseTime,
        isChecking: false,
      });
    } catch (error) {
      setApiActiveStatus({
        isActive: false,
        performance: 0,
        isChecking: false,
      });
    }
  };

  // 컴포넌트 마운트 시 API 상태 체크
  useEffect(() => {
    if (endpoint && inputSchema) {
      checkApiStatus();
    }
  }, [endpoint, inputSchema]);

  // 날짜 포맷팅 함수
  const formatExpiryDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // 새로운 디자인을 위한 카드 데이터 배열 생성
  // 주석: 새로운 디자인에 맞게 카드 데이터 배열 추가
  const statusCards = [
    {
      name: '활성화 상태',
      icon: (
        <button
          onClick={checkApiStatus}
          className="cursor-pointer rounded-full p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          disabled={apiActiveStatus.isChecking || !endpoint}
          title="상태 새로고침"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      ),
      value: apiActiveStatus.isChecking ? (
        <div className="flex items-center">
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
          <span className="text-base">확인 중...</span>
        </div>
      ) : (
        <div className="flex items-center">
          <div className={`mr-2 h-3 w-3 rounded-full ${apiActiveStatus.isActive ? 'bg-[theme(color-green-01)]' : 'bg-[theme(color-rose-01)]'}`}></div>
          <span>{apiActiveStatus.isActive ? '활성화' : '비활성화'}</span>
        </div>
      ),
      description: '현재 API 서비스 상태',
      bg: apiActiveStatus.isActive ? 'bg-[theme(color-green-03)]' : 'bg-[theme(color-rose-03)]',
      textColor: apiActiveStatus.isActive ? 'text-[theme(color-green-01)]' : 'text-[theme(color-rose-01)]',
      textSize: 'lg:text-3xl',
    },
    {
      name: '평균 응답 시간',
      icon: '⚡',
      value: apiActiveStatus.isChecking ? (
        <span className="text-base">확인 중...</span>
      ) : apiActiveStatus.performance > 0 ? (
        <span>{apiActiveStatus.performance}ms</span>
      ) : (
        <span className="text-gray-400">사용 불가</span>
      ),
      description: '최근 API 호출 응답 시간',
      bg: 'bg-[theme(color-blue-03)]',
      textColor: 'text-[theme(color-blue-01)]',
      textSize: 'lg:text-3xl',
    },
    {
      name: 'API 키 만료일',
      icon: '🔑',
      value: formatExpiryDate(apiStatus.expiresAt),
      description: 'API 키 갱신이 필요한 날짜',
      bg: 'bg-[theme(color-yellow-03)]',
      textColor: 'text-[theme(color-yellow-01)]',
      textSize: 'lg:text-xl',
    },
    {
      name: '모델 정확도',
      icon: '📊',
      value: apiStatus.accuracy ? `${(apiStatus.accuracy * 100).toFixed(2)}%` : apiStatus.rSquared ? `R²: ${(apiStatus.rSquared * 100).toFixed(2)}` : '정보 없음',
      description: apiStatus.accuracy ? '분류 모델 정확도' : '회귀 모델 성능',
      bg: 'bg-[theme(color-purple-03)]',
      textColor: 'text-[theme(color-purple-01)]',
      textSize: 'lg:text-3xl',
    },
  ];

  return (
    // 주석: 전체 컨테이너 스타일 업데이트
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* 주석: 제목 스타일 변경 */}
      <h2 className="mb-3 text-lg font-semibold text-[var(--primary-black)]">API 상태 정보</h2>

      {/* 주석: 카드 레이아웃 완전히 변경 - 그리드 시스템 및 반응형 디자인 적용 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 주석: map 함수로 카드 데이터 배열을 순회하여 동일한 스타일의 카드 생성 */}
        {statusCards.map((card, index) => (
          <div key={`api-status-${index}`} className={`${CssDetailHovering} flex flex-col rounded-lg ${card.bg} p-4 transition-all hover:shadow-md`}>
            {/* 주석: 카드 헤더 영역 - 이름과 아이콘 배치 */}
            <div className="mb-1 flex items-center justify-between">
              <span className="h-[2rem] text-start text-sm text-gray-500">{card.name}</span>
              <span className="font-tossface mt-1 mr-3 text-2xl lg:text-3xl">{card.icon}</span>
            </div>
            {/* 주석: 카드 값 영역 - 동적 스타일 적용 */}
            <div className={`text-start text-xl font-bold ${card.textSize} ${card.textColor}`}>{card.value}</div>
            {/* 주석: 카드 설명 영역 */}
            {/* <div className="text-xs text-gray-500">{card.description}</div> */}
          </div>
        ))}
      </div>
    </div>
  );
}
