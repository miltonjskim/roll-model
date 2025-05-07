package com.ccc.roll_model.pipeline.domain.model.client;

import com.ccc.roll_model.pipeline.domain.model.vo.ModelingData;

public interface MessagePublisher {
    void publishProcessingRequest(ModelingData modelingData);
}
