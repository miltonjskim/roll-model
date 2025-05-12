package com.ccc.roll_model.ai.domain;

import com.ccc.roll_model.ai.ui.response.ChatResponses;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@AllArgsConstructor
public class SessionData {
    private final String sessionId;
    private final String metadata;

    @JsonIgnore // CSV 데이터는 JSON 직렬화에서 제외 (크기가 클 수 있음)
    private final String csvData;

    private final List<ChatEntry> chatHistory = new ArrayList<>();
    private Instant lastActivity;

    public SessionData(String sessionId, String metadata, String csvData) {
        this.sessionId = sessionId;
        this.metadata = metadata;
        this.csvData = csvData;
        this.lastActivity = Instant.now();
    }

    public void updateLastActivity() {
        this.lastActivity = Instant.now();
    }

    public void addToHistory(ChatMessage userMessage, ChatResponses aiResponse) {
        chatHistory.add(new ChatEntry(userMessage, aiResponse,Instant.now()));
        updateLastActivity();
    }
}