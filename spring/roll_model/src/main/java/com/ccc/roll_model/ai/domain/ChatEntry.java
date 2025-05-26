package com.ccc.roll_model.ai.domain;

import com.ccc.roll_model.ai.ui.response.ChatResponses;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class ChatEntry {
    private final ChatMessage userMessage;
    private final ChatResponses aiResponse;
    private final Instant timestamp;

}
