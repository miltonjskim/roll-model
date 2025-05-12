package com.ccc.roll_model.fcm.ui.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SaveFCMTokenRequest {
    private String fcmToken;
    private String deviceInfo;  // 옵션임
}