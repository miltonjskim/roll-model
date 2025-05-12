package com.ccc.roll_model.fcm.application.command;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SaveFCMTokenCommand {
    private final Long memberId;
    private final String token;
    private final String deviceInfo;
}