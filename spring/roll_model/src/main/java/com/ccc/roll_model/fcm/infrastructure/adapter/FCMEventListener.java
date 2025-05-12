package com.ccc.roll_model.fcm.infrastructure.adapter;

import com.ccc.roll_model.fcm.application.FCMService;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
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

    @KafkaListener(topics = "model-training-status", groupId = "fcm-group")
    public void handleModelTrainingStatusEvent(ModelTrainingEvent event) {
        log.info("Received model training status event: {}", event);

        try {
            fcmService.sendModelTrainingStatusNotification(
                    event.getMemberId(),
                    event.getStatus(),
                    event.getModelName());

            log.info("FCM notification sent successfully for model: {}", event.getModelId());
        } catch (Exception e) {
            log.error("Error sending FCM notification: {}", e.getMessage(), e);
        }
    }
}