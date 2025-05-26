package com.ccc.roll_model.ai.ui.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatResponses {
    private String content;
    @Builder
    public ChatResponses(String content) {
        this.content = content;
    }
}
