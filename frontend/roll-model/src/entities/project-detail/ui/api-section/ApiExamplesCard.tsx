import { InputSchema } from '@/entities/project-detail/model/ApiTypes';

interface ApiExamplesCardProps {
  inputSchema: InputSchema;
}

export default function ApiExamplesCard({ inputSchema }: ApiExamplesCardProps) {
  return (
    <>
      <div className="mb-4 text-lg font-bold">API 요청 예제 및 응답 예제</div>

      <div className="space-y-4">
        <h3 className="font-medium">입력 스키마 확인</h3>
        <div className="rounded border bg-gray-50 p-4">
          <p className="mb-2">Feature 목록:</p>
          <ul className="list-disc space-y-2 pl-5">
            {inputSchema.features.map((feature, index) => (
              <li key={index} className="text-sm">
                <span className="font-semibold">{feature.name}</span>: <span className="text-blue-600">{feature.type}</span>
                {feature.required && <span className="ml-1 text-red-500">(필수)</span>}
                <span className="ml-2 text-gray-600">예시값: {typeof feature.example === 'object' ? JSON.stringify(feature.example) : String(feature.example)}</span>
                {feature.type === 'enum' && feature.options && <div className="mt-1 ml-2 text-gray-600">옵션: {feature.options.join(', ')}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
