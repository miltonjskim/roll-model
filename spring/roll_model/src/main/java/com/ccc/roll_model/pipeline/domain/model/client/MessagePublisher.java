package com.ccc.roll_model.pipeline.domain.model.client;

import com.ccc.roll_model.pipeline.domain.model.vo.ModelingData;

public interface MessagePublisher {
    void publishProcessingRequest(ModelingData modelingData);

    // 모델 학습 상태 이벤트 발행
    void publishModelTrainingStatus(String modelId, Integer memberId, String projectTitle, String status);
}
