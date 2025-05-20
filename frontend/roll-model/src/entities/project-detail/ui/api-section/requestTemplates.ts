import { InputSchema } from '@/entities/project-detail/model/ApiTypes';

type LanguageType = 'curl' | 'python' | 'javascript' | 'java';

interface TemplateProps {
  endpoint: {
    url: string;
    apiKey: string;
  };
  inputSchema: InputSchema;
}

/**
 * 선택된 언어에 맞는 API 요청 예제 코드를 생성합니다.
 * @param language 요청 예제를 생성할 프로그래밍 언어
 * @param param1 엔드포인트 정보와 입력 스키마 정보
 * @returns 해당 언어로 작성된 요청 예제 코드 문자열
 */
export const getRequestExample = (language: LanguageType, { endpoint, inputSchema }: TemplateProps): string => {
  // 입력 스키마로부터 예제 데이터 배열 생성
  const exampleValues = inputSchema.features.map((feature) => {
    // 문자열 "True"와 "False"를 boolean 값으로 변환
    if (feature.example === 'True') return true;
    if (feature.example === 'False') return false;
    return feature.example;
  });
  // API 요청에 필요한 형식으로 데이터 구조화
  const requestData = {
    inputs: [exampleValues],
  };

  switch (language) {
    case 'curl':
      return `curl -X POST "${endpoint.url}" \\
  -H "Content-Type: application/json" \\
  -H "apiKey: ${endpoint.apiKey}" \\
  -d '${JSON.stringify(requestData, null, 2)}'`;

    case 'python':
      return `import requests

url = "${endpoint.url}"
headers = {
    "Content-Type": "application/json",
    "apiKey": "${endpoint.apiKey}"
}
data = ${JSON.stringify(requestData, null, 2)
        .replace(/"true"/g, 'True')
        .replace(/"false"/g, 'False')}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`;

    case 'javascript':
      return `// API 호출 코드
const modelId = "${endpoint.url.split('/').pop()}"; // 모델 ID
const apiKey = "${endpoint.apiKey}"; // API 키

// 입력 데이터
const inputData = {
  inputs: ${JSON.stringify([exampleValues], null, 2)}
};

// API 호출
const response = await fetch(\`/api/model/\${modelId}\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apiKey: apiKey,
  },
  body: JSON.stringify(inputData),
});

if (!response.ok) {
  throw new Error(\`API 요청 오류: \${response.status}\`);
}
// 결과는 result에 저장
const result = await response.json();`;

    case 'java':
      return `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class ApiExample {
    public static void main(String[] args) {
        try {
            String url = "${endpoint.url}";
            String requestBody = "${JSON.stringify(requestData).replace(/"/g, '\\"')}";
            
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("apiKey", "${endpoint.apiKey}")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
                
            HttpResponse<String> response = client.send(request, 
                HttpResponse.BodyHandlers.ofString());
            
            System.out.println(response.body());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`;

    default:
      return '';
  }
};

/**
 * 프로젝트 카테고리에 따른 API 응답 예제를 생성합니다.
 * @param category 프로젝트 카테고리 (분류 또는 회귀)
 * @returns 해당 카테고리에 맞는 응답 예제 JSON 문자열
 */
export const getResponseExample = (category: 'CLASSIFICATION' | 'REGRESSION'): string => {
  if (category === 'CLASSIFICATION') {
    return `{
  "predictions": ["Class A"]
}`;
  } else {
    return `{
  "predictions": [42.8]
}`;
  }
};
