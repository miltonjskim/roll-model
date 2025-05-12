package com.ccc.roll_model.ai.application.service;
import com.ccc.roll_model.ai.domain.ChatEntry;
import com.ccc.roll_model.ai.ui.response.ChatResponses;
import com.ccc.roll_model.ai.ui.response.InitialResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;


@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAiService {
    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    private static final String INIT_MODEL = "gpt-4-turbo";
    private static final String DEFAULT_MODEL = "gpt-4o";

    // 스트리밍 응답 완료 후 전체 응답 저장
    private final Map<String, ChatResponses> sessionResponses = new ConcurrentHashMap<>();

    public OpenAiService() {
        this.restTemplate = new RestTemplate();
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        return headers;
    }

    public InitialResponse initializeChat(String sessionId, String csvData, String metadata) {
        log.info("채팅 시작: {}", sessionId);

        try {

            String systemPrompt = "너는 AI 전처리 분석가야. 지금부터 무조건 한국어로만 답변해야돼." +
                    "사용자는 AI에 대한 지식이 없고 전처리를 잘 할 줄 모르는 사람이야." +
                    "사용자의 csv 파일을 보고 어떤 전처리가 이 데이터 형식에서는 어울리고 어떤 순서대로 전처리를 해야 되는지 알려줘야해" +
                    "현재 우리 프로젝트에서 사용하는 전처리 방법에는 결측치 대체, 결측치 제거, 이상치 대체, 이상치 제거, 이상치 탐지,"+
                    "Z정규화, MIN_MAX 정규화, 로그 변환, 제곱근 변환, 원핫 인코딩, 레이블 인코딩, 타겟 인코딩, 클래스 불균형 처리,"+
                    "전처리 종료, 전처리 단계 삭제 이렇게 구성되어 있고 이 전처리 방법으로 대답해줘. 꼭 내가 알려준 전처리 방법으로만 "+
                    "대답해줘야해. 저 전처리 방법 외에는 절대 다른 이름의 전처리 방법으로 알려주지마"+
                    "그리고 이 학습된 전처리 데이터를 어떤 모델 학습을 시켜야 되는지도 알려줘. 우리는 머신 러닝만 사용해." +
                    "이건 회귀 모델을 사용해야 될것 같고 그 중에서도 뭘 사용해야 된다. 이런 식으로"+
                    "응답 형식은 프로젝트 명: \n, CSV 분석 내용 :,\n 추천 전처리: 1. , 2. , 3.....,"+
                    "전처리 순서"+
                    "1. 2. 3. .... , 추천 모델 학습 : \n"+ "이 템플릿 양식으로 최대한 간략하게 알려줘!."+
                    "그냥 추천 전처리 1. 로그 변환 2. 제곱근 변환... 추천 전처리 순서 \n 1. 레이블 인코딩, 2. 타겟 인코딩 ..."+
                    "이렇게 부가 설명 필요없이 방법, 순서만. 이 양식 무조건 지켜야돼!";

            String userMessage = "이 csv 분석하고: " + csvData + "\n이건 이 데이터셋에 활용할 프로젝트에 대한 정보야: " + metadata;

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", INIT_MODEL);
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userMessage)
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, createHeaders());

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    OPENAI_API_URL,
                    request,
                    Map.class
            );

            String assistantResponse = extractAssistantResponse(response.getBody());

            return new InitialResponse(sessionId, assistantResponse);
        } catch (Exception e) {
            log.error("OpenAI 채팅 실패", e);
            throw e;
        }
    }

    public ChatResponses generateResponse(String sessionId, String userMessage,
                                          String metadata, List<ChatEntry> chatHistory) {

        try {
            List<Map<String, String>> messages = convertChatHistoryToMessages(chatHistory,metadata);

            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", DEFAULT_MODEL);
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, createHeaders());

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    OPENAI_API_URL,
                    request,
                    Map.class
            );

            String assistantResponse = extractAssistantResponse(response.getBody());

            return new ChatResponses(assistantResponse);
        } catch (Exception e) {
            log.error("응답 생성 중 오류 발생", e);
            throw e;
        }
    }

    public void generateStreamingResponse(String sessionId, String userMessage,
                                          String metadata, List<ChatEntry> chatHistory,
                                          Consumer<String> chunkConsumer) {
          try {
            List<Map<String, String>> messages = convertChatHistoryToMessages(chatHistory,metadata);

            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", DEFAULT_MODEL);
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, createHeaders());

            // Make API call
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    OPENAI_API_URL,
                    request,
                    Map.class
            );

            String fullResponse = extractAssistantResponse(response.getBody());

            String[] sentences = fullResponse.split("(?<=[.!?]) ");
            StringBuilder completeResponse = new StringBuilder();

            for (String sentence : sentences) {
                if (!sentence.trim().isEmpty()) {
                    chunkConsumer.accept(sentence);
                    completeResponse.append(sentence).append(" ");
                }
            }

            sessionResponses.put(sessionId, new ChatResponses(completeResponse.toString().trim()));

        } catch (Exception e) {
            log.error("스트리밍형 응답 생성 중 오류 발생.", e);
            throw new RuntimeException("스트리밍형 응답 생성 중 오류 발생.", e);
        }
    }

    public ChatResponses getFullResponse(String sessionId) {
        return sessionResponses.remove(sessionId);
    }


    private String extractAssistantResponse(Map responseBody) {
        if (responseBody == null) {
            return "알맞은 요청이 아닙니다.";
        }

        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            Map<String, Object> firstChoice = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");

            return (String) message.get("content");
        } catch (Exception e) {
            log.error("응답 오류 발생", e);
            return "죄송합니다. 응답을 받아 오지 못했습니다.";
        }
    }

    private List<Map<String, String>> convertChatHistoryToMessages(List<ChatEntry> chatHistory,
                                                                   String metadata) {
        List<Map<String, String>> messages = new ArrayList<>();

        // 시스템 프롬프트는 초기 1회만
        chatHistory.stream()
                .filter(entry -> "system".equals(entry.getUserMessage().getRole()))
                .findFirst()
                .ifPresent(systemEntry ->
                        messages.add(Map.of("role", "system", "content", systemEntry.getUserMessage().getContent()))
                );

        // 나머지 대화 내용 (user ↔ assistant)
        chatHistory.stream()
                .filter(entry -> !"system".equals(entry.getUserMessage().getRole()))
                .forEach(entry -> {
                    messages.add(Map.of("role", entry.getUserMessage().getRole(), "content", entry.getUserMessage().getContent()));
                    if (entry.getAiResponse() != null) {
                        messages.add(Map.of("role", "assistant", "content", entry.getAiResponse().getContent()));
                    }
                });

        return messages;
    }

}