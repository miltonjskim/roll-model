package com.ccc.roll_model.ai.ui.response;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class InitialResponse {
    private String sessionId;
    private String content;

    @Builder
    public InitialResponse(String sessionId, String content) {
        this.sessionId = sessionId;
        this.content = content;
    }
}