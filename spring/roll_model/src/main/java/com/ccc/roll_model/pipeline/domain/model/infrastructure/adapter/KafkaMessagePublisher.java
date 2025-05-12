package com.ccc.roll_model.pipeline.domain.model.infrastructure.adapter;

import com.ccc.roll_model.fcm.domain.event.ModelTrainingEvent;
import com.ccc.roll_model.pipeline.domain.model.client.MessagePublisher;
import com.ccc.roll_model.pipeline.domain.model.vo.ModelingData;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Kafka 메시지 발행
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class KafkaMessagePublisher implements MessagePublisher {

    private final KafkaTemplate<String,String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    @Value("${spring.kafka.topic.processing-data.name}")
    private String topicName;


    @Override
    public void publishProcessingRequest(ModelingData modelingData) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(modelingData);

            log.info("Kafka topic name: {}", topicName);
            log.info("Kafka 메시지: {}", jsonMessage);

            kafkaTemplate.send(topicName, jsonMessage);
            log.info("kafka 메시지 발생 완료");
        } catch(Exception e) {
            throw new RuntimeException("kafka 메시지 발행 실패: " + e.getMessage(), e);
        }
    }

    @Value("${spring.kafka.topic.model-training-status.name:model-training-status}")
    private String modelTrainingStatusTopic;

    /**
     * 모델 학습 상태 이벤트 발행
     */
    public void publishModelTrainingStatus(String modelId, Integer memberId, String modelName, String status) {
        try {
            ModelTrainingEvent event = new ModelTrainingEvent(modelId, memberId, modelName, status);
            String jsonMessage = objectMapper.writeValueAsString(event);

            log.info("Model Training Status Topic: {}", modelTrainingStatusTopic);
            log.info("Model Training Status Event: {}", jsonMessage);

            kafkaTemplate.send(modelTrainingStatusTopic, jsonMessage);
            log.info("모델 학습 상태 이벤트 발행 완료");
        } catch(Exception e) {
            log.error("모델 학습 상태 이벤트 발행 실패: {}", e.getMessage(), e);
        }
    }
}
