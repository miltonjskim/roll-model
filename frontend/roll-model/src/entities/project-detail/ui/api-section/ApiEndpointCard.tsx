import { Endpoint } from '@/entities/project-detail/model/ApiTypes';
import { useState } from 'react';
import { IoMdCopy } from 'react-icons/io';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface ApiEndpointCardProps {
  endpoint: Endpoint;
}

export default function ApiEndpointCard({ endpoint }: ApiEndpointCardProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  // URL 복사 함수
  const copyToClipboard = (text: string, type: 'URL' | 'API Key') => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert(`${type}가 클립보드에 복사되었습니다.`);
      })
      .catch((err) => {
        console.error('복사 실패:', err);
        alert('복사 중 오류가 발생했습니다.');
      });
  };

  // API 키 마스킹 함수
  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (showApiKey) return key;

    // 처음 4자와 마지막 4자만 표시하고 나머지는 * 처리
    const prefix = key.substring(0, 4);
    const suffix = key.substring(key.length - 4);
    const masked = '*'.repeat(key.length - 8);

    return `${prefix}${masked}${suffix}`;
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-[var(--primary-black)]">API 엔드포인트</h2>

      {/* URL */}
      <div className="mb-6">
        <div className="mb-2 ml-2 flex items-center text-sm font-medium text-gray-600">
          <span>엔드포인트 URL</span>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <div className="flex-grow overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">{endpoint.url}</div>
          <button
            onClick={() => copyToClipboard(endpoint.url, 'URL')}
            className="bg-[theme(primary-black)] flex items-center justify-center rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90"
          >
            <IoMdCopy className="mr-2 h-5 w-5" />
            URL 복사
          </button>
        </div>
        <p className="mt-2 ml-2 text-xs text-gray-500">이 URL로 모델 예측 API를 호출할 수 있습니다.</p>
      </div>
      {/* API 키 */}
      <div>
        <div className="mb-2 ml-2 flex items-center text-sm font-medium text-gray-600">
          <span>API 키</span>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <div className="flex flex-grow justify-between overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            {maskApiKey(endpoint.apiKey)}
            <button
              onMouseDown={() => setShowApiKey(true)}
              onMouseUp={() => setShowApiKey(false)}
              onMouseLeave={() => setShowApiKey(false)}
              onTouchStart={() => setShowApiKey(true)}
              onTouchEnd={() => setShowApiKey(false)}
              onTouchCancel={() => setShowApiKey(false)}
              className="flex items-center justify-center font-medium text-[var(--primary-black)]"
            >
              {showApiKey ? <FaEye className="h-4 w-4" /> : <FaEyeSlash className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={() => copyToClipboard(endpoint.apiKey, 'API Key')}
            className="bg-[theme(primary-black)] flex items-center justify-center rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90"
          >
            <IoMdCopy className="mr-2 h-5 w-5" />
            KEY 복사
          </button>
        </div>
        <p className="mt-2 ml-2 text-xs text-gray-500">API 요청 인증을 위한 비밀 키입니다. 안전하게 보관하세요.</p>
      </div>
    </div>
  );
}
