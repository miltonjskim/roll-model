package com.ccc.roll_model.fcm.infrastructure.adapter;

import com.ccc.roll_model.fcm.application.FCMService;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import com.ccc.roll_model.fcm.domain.event.ModelTrainingEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class FCMEventListener {

    private final FCMService fcmService;

    @KafkaListener(topics = "train-status", groupId = "handle-train-status")
    public void handleModelTrainingStatusEvent(String jsonMessage) {

        log.info("Received model training status event: {}", event);

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            // 스네이크 케이스 -> 카멜 케이스 변환 설정
            objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
            // JSON -> 객체 변환
            ModelTrainingEvent event = objectMapper.readValue(jsonMessage, ModelTrainingEvent.class);

            log.info("Received model training status event: {}", event);

            try {
                fcmService.sendModelTrainingStatusNotification(
                        event.getMemberId(),
                        event.getStatus(),
                        event.getProjectId(),
                        event.getPipelineId());

                log.info("FCM notification sent successfully for model: {}", event.getPipelineId());
            } catch (Exception e) {
                log.error("Error sending FCM notification: {}", e.getMessage(), e);
            }

        } catch (Exception e) {
            // 오류 처리
            log.error("Error processing Kafka message: {}", e.getMessage(), e);
        }
    }
}
