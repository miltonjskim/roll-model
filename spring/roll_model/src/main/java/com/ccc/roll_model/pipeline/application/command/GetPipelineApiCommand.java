package com.ccc.roll_model.pipeline.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetPipelineApiCommand {
    private String pipelineId;
    private Integer memberId;
}