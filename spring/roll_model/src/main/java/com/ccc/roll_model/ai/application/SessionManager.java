package com.ccc.roll_model.ai.application;

import com.ccc.roll_model.ai.domain.ChatMessage;
import com.ccc.roll_model.ai.domain.SessionData;
import com.ccc.roll_model.ai.ui.response.ChatResponses;
import com.ccc.roll_model.ai.ui.response.InitialResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionManager {
    private static final Logger log = LoggerFactory.getLogger(SessionManager.class);

    // 세션 타임아웃 (24시간)
    private static final Duration SESSION_TIMEOUT = Duration.ofHours(24);

    private final Map<String, SessionData> sessions = new ConcurrentHashMap<>();

    public void createSession(String sessionId, String csvData, String metadata, InitialResponse initialResponse) {
        SessionData sessionData = new SessionData(sessionId, metadata, csvData);

        // 초기 AI 응답 추가
        ChatMessage systemMessage = new ChatMessage("system","Initial analysis");

        ChatResponses aiResponse = new ChatResponses(initialResponse.getContent());

        sessionData.addToHistory(systemMessage, aiResponse);
        sessions.put(sessionId, sessionData);

        log.info("세션 생성n: {}", sessionId);
    }

    public SessionData getSession(String sessionId) {
        SessionData sessionData = sessions.get(sessionId);
        if (sessionData != null) {
            // 세션 접근 시 마지막 활동 시간 갱신
            sessionData.updateLastActivity();
        }
        return sessionData;
    }

    public void updateChatHistory(String sessionId, ChatMessage userMessage, ChatResponses aiResponse) {
        SessionData sessionData = sessions.get(sessionId);
        if (sessionData != null) {
            sessionData.addToHistory(userMessage, aiResponse);
            sessionData.updateLastActivity();
            log.debug("세션 채팅 목록 업데이트: {}", sessionId);
        } else {
            log.warn("세션 채팅 목록 업데이트 실패: {}", sessionId);
        }
    }

    // 만료된 세션 정리 (1시간마다 실행)
    @Scheduled(fixedRate = 1400000)
    public void cleanupExpiredSessions() {
        log.info("세션 정리");
        Instant now = Instant.now();

        sessions.entrySet().removeIf(entry -> {
            SessionData sessionData = entry.getValue();
            Duration sinceLastActivity = Duration.between(sessionData.getLastActivity(), now);

            if (sinceLastActivity.compareTo(SESSION_TIMEOUT) > 0) {
                log.info("Removing expired session: {}", entry.getKey());
                return true;
            }
            return false;
        });
    }

    public int getActiveSessionCount() {
        return sessions.size();
    }
}
