package com.ccc.roll_model.ai.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ChatMessage {
    private final String role;
    private final String content;
}
