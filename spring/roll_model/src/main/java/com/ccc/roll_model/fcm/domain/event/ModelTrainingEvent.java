package com.ccc.roll_model.fcm.domain.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ModelTrainingEvent {
    @JsonProperty("event_type")
    private String eventType;

    private String timestamp;

    @JsonProperty("pipeline_id")
    private String pipelineId;

    @JsonProperty("project_id")
    private Integer projectId;

    @JsonProperty("member_id")
    private Integer memberId;

    @JsonProperty("model_type")
    private String modelType;

    @JsonProperty("model_path")
    private String modelPath;

    @JsonProperty("error_message")
    private String errorMessage;

    private String status;
}