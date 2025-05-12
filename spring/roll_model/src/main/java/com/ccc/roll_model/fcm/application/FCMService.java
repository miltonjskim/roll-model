package com.ccc.roll_model.fcm.application;

import com.ccc.roll_model.fcm.application.command.SaveFCMTokenCommand;
import com.ccc.roll_model.fcm.infrastructure.entity.FCMTokenEntity;
import com.ccc.roll_model.fcm.infrastructure.repository.mysql.FCMTokenRepository;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FCMService {

    private final FirebaseApp firebaseApp;
    private final FCMTokenRepository fcmTokenRepository;

    // 토큰 저장
    @Transactional
    public void saveToken(SaveFCMTokenCommand command) {
        Optional<FCMTokenEntity> tokenEntity = fcmTokenRepository.findByMemberIdAndToken(
                command.getMemberId(), command.getToken());

        if (tokenEntity.isPresent()) {
            // 기존 토큰이 있으면 활성화 상태로 업데이트
            FCMTokenEntity existingToken = tokenEntity.get();
            existingToken.updateToken(command.getToken());
        } else {
            // 새 토큰 생성
            FCMTokenEntity newToken = FCMTokenEntity.builder()
                    .memberId(command.getMemberId())
                    .token(command.getToken())
                    .deviceInfo(command.getDeviceInfo())
                    .isActive(true)
                    .build();
            fcmTokenRepository.save(newToken);
        }
    }

    // 모델 학습 상태에 따른 메시지 발송
    @Transactional
    public void sendModelTrainingStatusNotification(Integer memberId, String status, String projectTitle) {
        List<FCMTokenEntity> tokens = fcmTokenRepository.findByMemberIdAndIsActiveTrue(memberId);
        if (tokens.isEmpty()) {
            log.info("No active FCM tokens found for member: {}", memberId);
            return; // 활성화된 토큰이 없으면 발송 불가
        }

        Map<String, String> data = new HashMap<>();

        switch (status) {
//            case "COMPLETED":
//                data.put("title", "모델 학습 완료");
//                data.put("body", projectTitle + "의 학습이 성공적으로 완료되었습니다.");
//                data.put("state", "COMPLETED");
//                break;
//            case "FAILED":
//                data.put("title", "모델 학습 실패");
//                data.put("body", projectTitle + " 학습 중 문제가 발생했습니다.");
//                data.put("state", "FAILED");
//                break;
            case "COMPLETED":
                data.put("title", projectTitle);
                data.put("body", "모델 학습이 성공적으로 완료되었습니다.");
                data.put("state", "COMPLETED");
                break;
            case "FAILED":
                data.put("title", projectTitle);
                data.put("body", "모델 학습 중 문제가 발생했습니다.");
                data.put("state", "FAILED");
                break;
            default:
                log.info("Unknown model status: {}", status);
                return; // 알 수 없는 상태는 발송하지 않음
        }

        // 모든 활성화된 토큰에 메시지 전송
        for (FCMTokenEntity tokenEntity : tokens) {
            sendMessage(tokenEntity.getToken(), data);
        }
    }

    // FCM 메시지 전송
    private void sendMessage(String token, Map<String, String> data) {
        try {
            Message message = Message.builder()
                    .setToken(token)
                    .putAllData(data) // 데이터 메시지만 전송
                    .build();

            String response = FirebaseMessaging.getInstance(firebaseApp).send(message);
            log.info("FCM 메시지 발송 성공: {}", response);
        } catch (FirebaseMessagingException e) {
            log.error("FCM 메시지 발송 실패: {}", e.getMessage(), e);

            // 토큰 무효화 처리
            if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED ||
                    e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT) {
                try {
                    Optional<FCMTokenEntity> tokenEntityOpt = fcmTokenRepository.findByTokenAndIsActiveTrue(token);
                    tokenEntityOpt.ifPresent(FCMTokenEntity::deactivate);
                    log.info("Token deactivated due to FCM error: {}", token);
                } catch (Exception ex) {
                    log.error("Error while deactivating token: {}", ex.getMessage(), ex);
                }
            }
        }
    }
}