package com.ccc.roll_model.pipeline.ui.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistributionResponse {
    private String name;
    private String type;
    private AxisDTO xAxis;
    private AxisDTO yAxis;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AxisDTO {
        private String label;
        private List<Object> values;
    }
}