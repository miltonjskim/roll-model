import { InputSchema } from '@/entities/project-detail/model/ApiTypes';

type LanguageType = 'curl' | 'python' | 'javascript' | 'java';

interface TemplateProps {
  endpoint: {
    url: string;
    apiKey: string;
  };
  inputSchema: InputSchema;
}

export const getRequestExample = (language: LanguageType, { endpoint, inputSchema }: TemplateProps): string => {
  // 입력 데이터 구성
  const requestData = inputSchema.features.reduce(
    (obj, feature) => {
      obj[feature.name] = feature.example;
      return obj;
    },
    {} as Record<string, any>,
  );

  switch (language) {
    case 'curl':
      return `curl -X POST "${endpoint.url}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestData, null, 2)}'`;

    case 'python':
      return `import requests

url = "${endpoint.url}"
headers = {
    "Content-Type": "application/json"
}
data = ${JSON.stringify(requestData, null, 2)
        .replace(/"True"/g, 'True')
        .replace(/"False"/g, 'False')}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`;

    case 'javascript':
      return `// Fetch API 사용
const url = "${endpoint.url}";
const headers = {
  "Content-Type": "application/json"
};
const data = ${JSON.stringify(requestData, null, 2)};

fetch(url, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(data)
})
.then(response => response.json())
.then(result => console.log(result))
.catch(error => console.error('API 요청 오류:', error));`;

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
// 응답 예제 생성 함수도 여기에 추가할 수 있습니다
export const getResponseExample = (category: 'CLASSIFICATION' | 'REGRESSION'): string => {
  if (category === 'CLASSIFICATION') {
    return `{
  "predicted_class": "Positive"
}`;
  } else {
    return `{
  "predicted_value": 42.8
}`;
  }
};
