package com.ccc.roll_model.pipeline.domain.model.vo;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.ccc.roll_model.pipeline.domain.model.common.ModelType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import lombok.Builder;
import lombok.Getter;

import java.io.Serializable;
import java.util.Objects;

/**
 * kafka 메시지 전송을 위한 VO
 */

@Getter
@JsonDeserialize(builder = ModelingData.ProcessingDataBuilder.class)
public class ModelingData implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("project_id")
    private final Integer projectId;

    @JsonProperty("member_id")
    private final Integer memberId;

    @JsonProperty("pipeline_id")
    private final String pipelineId;

    @JsonProperty("model_type")
    private final ModelType modelType;

    @JsonProperty("parameters")
    private final ModelParameter parameters;

    @JsonProperty("train_data_path")
    private final String trainDataPath;

    @JsonProperty("target_column")
    private final String targetColumn;

    @JsonPOJOBuilder(withPrefix = "")
    public static class ProcessingDataBuilder {

    }

    @Builder
    public ModelingData(Integer projectId, Integer memberId, String pipelineId, ModelType modelType,
                        ModelParameter parameters, String trainDataPath, String targetColumn) {
        this.projectId = projectId;
        this.memberId = memberId;
        this.pipelineId = pipelineId;
        this.modelType = modelType;
        this.parameters = parameters;
        this.trainDataPath = trainDataPath;
        this.targetColumn = targetColumn;
    }

    @Override
    public String toString() {
        return "ModelingData{" +
                "projectId=" + projectId +
                ", memberId=" + memberId +
                ", pipelineId='" + pipelineId + '\'' +
                ", modelType='" + modelType + '\'' +
                ", parameters=" + parameters +
                ", trainDataPath='" + trainDataPath + '\'' +
                ", targetColumn='" + targetColumn + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object obj) {
       if(obj instanceof ModelingData data) {
           return data.getProjectId().equals(projectId)&&
                   data.getMemberId().equals(memberId) &&
                   data.getPipelineId().equals(pipelineId) &&
                   data.getModelType().equals(modelType) &&
                   data.getParameters().equals(parameters)&&
                   data.getTrainDataPath().equals(trainDataPath) &&
                   data.getTargetColumn().equals(targetColumn);
       }

       return false;
    }

    @Override
    public int hashCode() {
        return Objects.hash(projectId, memberId, pipelineId, modelType, parameters, trainDataPath, targetColumn);
    }
}
