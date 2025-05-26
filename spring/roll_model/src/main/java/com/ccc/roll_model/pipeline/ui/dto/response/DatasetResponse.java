package com.ccc.roll_model.pipeline.ui.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetResponse {
    private String id;
    private Integer recordCount;
    private Integer featureCount;
    private String targetVariable;
    private String missingRate;
}