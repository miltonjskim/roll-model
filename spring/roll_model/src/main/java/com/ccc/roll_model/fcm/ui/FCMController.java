package com.ccc.roll_model.fcm.ui;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

import java.util.HashMap;

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
                    memberId,
                    request.getFcmToken(),
                    request.getDeviceInfo() != null ? request.getDeviceInfo() : "unknown"
            );

            // 서비스 호출
            fcmService.saveToken(command);

            // 성공 응답 반환
            return ResponseEntity.ok(ApiUtils.success(new HashMap<>()));

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
    @PostMapping("/test-notification/{memberId}")
    public ResponseEntity<?> testNotification(
            @PathVariable Integer memberId,
            @RequestParam(defaultValue = "테스트 프로젝트") String projectTitle,
            @RequestParam(defaultValue = "COMPLETED") String status) {

        log.info("FCM 알림 테스트: memberId={}, status={}, projectTitle={}", memberId, status, projectTitle);

        try {
            fcmService.sendModelTrainingStatusNotification(memberId, status, projectTitle);
            return ResponseEntity.ok(ApiUtils.success("알림 전송 성공"));
        } catch (Exception e) {
            log.error("알림 전송 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiUtils.error(ErrorCode.INVALID_INPUT_PARAMETER));
        }
    }
}