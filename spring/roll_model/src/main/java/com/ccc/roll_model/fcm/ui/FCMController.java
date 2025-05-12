package com.ccc.roll_model.fcm.ui;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ccc.roll_model.fcm.application.FCMService;
import com.ccc.roll_model.fcm.application.command.SaveFCMTokenCommand;
import com.ccc.roll_model.fcm.ui.dto.request.SaveFCMTokenRequest;
import com.ccc.roll_model.fcm.ui.dto.response.SaveFCMTokenResponse;
import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.global.security.utils.JWTUtils;
import com.ccc.roll_model.global.utils.ApiUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.servlet.http.HttpServletRequest;

@Slf4j
@RestController
@RequestMapping("/api/v1/fcm")
@RequiredArgsConstructor
public class FCMController {

    private final FCMService fcmService;
    private final JWTUtils jwtUtils;

    @PostMapping("/token")
    public ResponseEntity<?> saveFCMToken(
            @RequestBody SaveFCMTokenRequest request,
            HttpServletRequest httpRequest) {

        try {
            // Authorization 헤더에서 토큰 가져오기
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new ApiException(ErrorCode.AUTHENTICATION_FAILED);
            }

            // "Bearer " 제거하고 토큰만 추출
            String token = authHeader.substring(7);

            // JWTUtils를 사용하여 회원 ID 가져오기
            Integer memberId = jwtUtils.getMemberId(token);
            if (memberId == null) {
                throw new ApiException(ErrorCode.USER_NOT_FOUND);
            }

            // Command 객체 생성
            SaveFCMTokenCommand command = new SaveFCMTokenCommand(
                    memberId.longValue(),
                    request.getFcmToken(),
                    request.getDeviceInfo() != null ? request.getDeviceInfo() : "unknown"
            );

            // 서비스 호출
            fcmService.saveToken(command);

            // 성공 응답 반환
            return ResponseEntity.ok(ApiUtils.success(new SaveFCMTokenResponse()));

        } catch (ApiException e) {
            log.error("API Exception while saving FCM token: {}", e.getMessage());
            return ResponseEntity.status(e.getErrorCode().getStatus())
                    .body(ApiUtils.error(e.getErrorCode()));
        } catch (Exception e) {
            log.error("Unexpected exception while saving FCM token: {}", e.getMessage(), e);
            return ResponseEntity.status(ErrorCode.INVALID_INPUT_PARAMETER.getStatus())
                    .body(ApiUtils.error(ErrorCode.INVALID_INPUT_PARAMETER));
        }
    }
}