package com.ccc.roll_model.project.application.command;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateProjectCommand {

    private final Integer memberId;
    private final String title;
    private final String description;
    private final String category;
    private final String domain;
    private final Boolean publicYn;
}
