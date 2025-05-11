package com.ccc.roll_model.pipeline.ui.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@NoArgsConstructor
@AllArgsConstructor
//@JsonInclude(JsonInclude.Include.NON_NULL) // null 값 필드는 JSON에 포함하지 않음
public class DistributionResponse {
    private String name;
    private String type;

    @JsonProperty("xAxis")
    private AxisDTO xAxis;

    @JsonProperty("yAxis")
    private AxisDTO yAxis;

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    @JsonProperty("xAxis") // 속성 이름 명시적 지정
    public AxisDTO getXAxis() {
        return xAxis;
    }

    @JsonProperty("yAxis") // 속성 이름 명시적 지정
    public AxisDTO getYAxis() {
        return yAxis;
    }

    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AxisDTO {
        private String label;
        private List<Object> values;

        public String getLabel() {
            return label;
        }

        public List<Object> getValues() {
            return values;
        }
    }
}
