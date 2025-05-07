package com.ccc.roll_model.pipeline.ui.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectInfoResponse {
    private String title;
    private String category;
    private String domain;
    private String version;
    private Boolean projectPublicYn;
    private Boolean pipelinePublicYn;
    private Boolean ownerYn;
}