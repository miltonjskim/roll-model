package com.ccc.roll_model.pipeline.ui.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreprocessingStepResponse {
    private String type;
    private Map<String, Object> parameters;
    private Integer order;
    private Boolean active;
}