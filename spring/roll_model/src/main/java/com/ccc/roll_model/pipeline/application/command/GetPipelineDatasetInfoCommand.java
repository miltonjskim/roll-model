package com.ccc.roll_model.pipeline.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetPipelineDatasetInfoCommand {
    private Integer memberId;
    private String pipelineId;

    public boolean validate() {
        return memberId != null && pipelineId != null && !pipelineId.isEmpty();
    }
}