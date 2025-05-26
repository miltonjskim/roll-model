package com.ccc.roll_model.project.application.command;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExportModelCommand {
    private String pipelineId;
    private Integer memberId;
}