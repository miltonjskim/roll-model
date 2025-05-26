import { useState } from 'react';
import { InputSchema } from '@/entities/project-detail/model/ApiTypes';
import { FaCopy } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { getRequestExample, getResponseExample } from '@/entities/project-detail/ui/api-section/requestTemplates';
// import { getRequestExample, getResponseExample } from '@/entities/project-detail/ui/api-section/requestTemplatesNoApiKey';

interface ApiExamplesCardProps {
  inputSchema: InputSchema;
  endpoint: {
    url: string;
    apiKey: string;
  };
  projectCategory: 'CLASSIFICATION' | 'REGRESSION';
}

export default function ApiExamplesCard({ inputSchema, endpoint, projectCategory }: ApiExamplesCardProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'python' | 'javascript' | 'java'>('curl');
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // 선택된 언어에 따른 구문 강조 언어 매핑
  const getHighlightLanguage = (language: string) => {
    switch (language) {
      case 'curl':
        return 'bash';
      case 'python':
        return 'python';
      case 'javascript':
        return 'javascript';
      case 'java':
        return 'java';
      default:
        return 'bash';
    }
  };

  // 복사 함수
  const copyRequestToClipboard = () => {
    navigator.clipboard.writeText(requestExample);
    setCopiedRequest(true);
    setTimeout(() => setCopiedRequest(false), 2000);
  };

  const copyResponseToClipboard = () => {
    navigator.clipboard.writeText(responseExample);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const requestExample = getRequestExample(selectedLanguage, { endpoint, inputSchema });
  const responseExample = getResponseExample(projectCategory);

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-gray-800">API 요청 예제 및 응답 예제</h2>

      {/* 언어 선택 탭 */}
      <div className="mb-4 flex space-x-2 overflow-x-auto pb-2">
        {['curl', 'python', 'javascript', 'java'].map((lang) => (
          <button
            key={lang}
            className={`rounded-md px-4 py-2 transition-colors ${selectedLanguage === lang ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setSelectedLanguage(lang as any)}
          >
            {lang.charAt(0).toUpperCase() + lang.slice(1)}
          </button>
        ))}
      </div>

      {/* 요청 예제 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-medium">요청 예제</h3>
          <button onClick={copyRequestToClipboard} className="flex items-center rounded px-2 py-1 text-sm hover:bg-gray-100">
            <FaCopy className="mr-1" /> {copiedRequest ? '복사됨!' : '복사'}
          </button>
        </div>
        <div className="overflow-hidden rounded-lg">
          <SyntaxHighlighter
            language={getHighlightLanguage(selectedLanguage)}
            style={atomDark}
            customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.875rem' }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {requestExample}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* 응답 예제 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-medium">응답 예제</h3>
          <button onClick={copyResponseToClipboard} className="flex items-center rounded px-2 py-1 text-sm hover:bg-gray-100">
            <FaCopy className="mr-1" /> {copiedResponse ? '복사됨!' : '복사'}
          </button>
        </div>
        <div className="overflow-hidden rounded-lg">
          <SyntaxHighlighter language="json" style={atomDark} customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.875rem' }} wrapLines={true} wrapLongLines={true}>
            {responseExample}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
