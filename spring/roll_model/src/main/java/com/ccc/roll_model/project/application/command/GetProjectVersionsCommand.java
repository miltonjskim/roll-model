package com.ccc.roll_model.project.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GetProjectVersionsCommand {
    private String pipelineId;
    private Integer memberId;
}