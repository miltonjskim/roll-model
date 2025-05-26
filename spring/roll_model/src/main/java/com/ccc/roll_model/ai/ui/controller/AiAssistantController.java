package com.ccc.roll_model.ai.ui.controller;

import com.ccc.roll_model.ai.application.SessionManager;
import com.ccc.roll_model.ai.application.service.OpenAiService;
import com.ccc.roll_model.ai.domain.ChatMessage;
import com.ccc.roll_model.ai.domain.SessionData;
import com.ccc.roll_model.ai.ui.response.ChatResponses;
import com.ccc.roll_model.ai.ui.response.InitialResponse;
import com.ccc.roll_model.ai.utils.CsvUtils;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.global.utils.ApiUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/pipelines")
class AiAssistantController {

    private final OpenAiService openAiService;
    private final SessionManager sessionManager;

    // 전용 스레드 풀 생성 - API 호출에 최적화
    private final Executor aiTaskExecutor = Executors.newFixedThreadPool(10);

    @PostMapping(value = "/{pipelineId}/preprocessing/recommendation", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiUtils.ApiResponse<?> initialize(
            @RequestParam("file") MultipartFile csvFile,
            @RequestParam("metadata") String metadata) throws IOException {

        log.info("세션 연결을 시작합니다.");

        try {
            String sessionId = UUID.randomUUID().toString();
            String csvContent = new String(csvFile.getBytes(), StandardCharsets.UTF_8);

            String summarizedCsv = CsvUtils.summarizeCsv(csvContent,3);

            // 비동기 처리를 통한 초기화 시작
            CompletableFuture<InitialResponse> futureResponse = CompletableFuture
                    .supplyAsync(() -> openAiService.initializeChat(sessionId, summarizedCsv, metadata), aiTaskExecutor);
            InitialResponse response = futureResponse.get();

            // 세션 저장 (백그라운드에서 처리)
            CompletableFuture.runAsync(() ->
                    sessionManager.createSession(sessionId, csvContent, metadata, response), aiTaskExecutor);

            log.info("Session initialized successfully: {}", sessionId);
            return ApiUtils.success(response);
        } catch (Exception e) {
            log.error("Error initializing session", e);
            return ApiUtils.error(ErrorCode.AI_CHAT_FAILED);
        }
    }

    @PostMapping("/{pipelineId}/preprocessing/message/{sessionId}")
    public ApiUtils.ApiResponse<?> sendMessage(
            @PathVariable String sessionId,
            @RequestBody ChatMessage message) {

        SessionData sessionData = sessionManager.getSession(sessionId);
        if (sessionData == null) {
            log.warn("Session not found: {}", sessionId);
            return ApiUtils.error(ErrorCode.AI_CHAT_FAILED);
        }

        try {
            // 타임아웃 설정으로 응답 시간 보장
            CompletableFuture<ChatResponses> futureResponse = CompletableFuture
                    .supplyAsync(() -> openAiService.generateResponse(
                            sessionId,
                            message.getContent(),
                            sessionData.getMetadata(),
                            sessionData.getChatHistory()
                    ), aiTaskExecutor);

            ChatResponses response = futureResponse.get();

            // 대화 기록 업데이트 (비동기)
            CompletableFuture.runAsync(() ->
                    sessionManager.updateChatHistory(sessionId, message, response), aiTaskExecutor);

            log.info("메시지가 성공적으로 생성되었습니다.: {}", sessionId);
            return ApiUtils.success(response);
        } catch (Exception e) {
            log.error("Error processing message", e);
            return ApiUtils.error(ErrorCode.AI_CHAT_FAILED);
        }
    }

    @PostMapping("/{pipelineId}/preprocessing/stream/{sessionId}")
    public SseEmitter streamResponse(@PathVariable String sessionId, @RequestBody ChatMessage message) {
        log.info("스트리밍 세션 시작: {}", sessionId);

        SessionData sessionData = sessionManager.getSession(sessionId);
        if (sessionData == null) {
            log.warn("세션을 찾지 못했습니다: {}", sessionId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "세션을 찾지 못했습니다.");
        }

        // 타임아웃 설정 최적화
        SseEmitter emitter = new SseEmitter(120000L); // 1분으로 축소

        // 연결 설정 및 오류 처리
        emitter.onCompletion(() -> log.info("SSE completed for session: {}", sessionId));
        emitter.onTimeout(() -> log.warn("SSE timeout for session: {}", sessionId));
        emitter.onError((ex) -> log.error("SSE error for session: {}", sessionId, ex));

        // 비동기로 응답 처리 - 최적화된 스레드 풀 사용
        CompletableFuture.runAsync(() -> {
            try {

                openAiService.generateStreamingResponse(
                        sessionId,
                        message.getContent(),
                        sessionData.getMetadata(),
                        sessionData.getChatHistory(),
                        (partialResponse) -> {
                            try {
                                // 부분 응답 전송
                                emitter.send(SseEmitter.event()
                                        .data(partialResponse)
                                        .id(UUID.randomUUID().toString())
                                        .name("message"));
                            } catch (IOException e) {
                                log.error("Error sending SSE event", e);
                                emitter.completeWithError(e);
                            }
                        }
                );

                // 응답 완료
                emitter.complete();

                // 대화 기록 비동기 업데이트
                CompletableFuture.runAsync(() -> {
                    ChatResponses fullResponse = openAiService.getFullResponse(sessionId);
                    sessionManager.updateChatHistory(sessionId, message, fullResponse);
                }, aiTaskExecutor);

                log.info("스트리밍 세션 성공: {}", sessionId);

            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        }, aiTaskExecutor);

        return emitter;
    }

    @GetMapping("/{pipelineId}/preprocessing/sessions/{sessionId}")
    public ResponseEntity<SessionData> getSessionData(@PathVariable String sessionId) {
        SessionData sessionData = sessionManager.getSession(sessionId);
        if (sessionData == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(sessionData);
    }
}
