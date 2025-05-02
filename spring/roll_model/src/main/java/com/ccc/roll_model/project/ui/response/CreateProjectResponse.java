package com.ccc.roll_model.project.ui.response;

import com.ccc.roll_model.project.infrastructure.entity.Category;
import com.ccc.roll_model.project.infrastructure.entity.Domain;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Builder
public class CreateProjectResponse {

    private final Integer id;
    private final String title;
    private final String description;
    private final Domain domain;
    private final Category type;
    private final Boolean isPublic;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private final LocalDateTime createdAt;
}
