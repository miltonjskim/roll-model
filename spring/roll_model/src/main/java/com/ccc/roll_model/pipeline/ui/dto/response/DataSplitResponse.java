package com.ccc.roll_model.pipeline.ui.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataSplitResponse {
    private String method;
    private Double trainRatio;
    private Double testRatio;
    private Double validationRatio;
}