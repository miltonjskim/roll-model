package com.ccc.roll_model.project.ui.request;

import lombok.Getter;

@Getter
public class CreateProjectRequest {
    private String title;
    private String description;
    private String domain;
    private String type;
}