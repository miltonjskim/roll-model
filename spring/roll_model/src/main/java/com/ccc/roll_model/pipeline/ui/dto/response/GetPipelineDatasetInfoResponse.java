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
public class GetPipelineDatasetInfoResponse {
    private ProjectInfoResponse projectInfo;
    private DatasetResponse dataset;
    private List<PreprocessingStepResponse> preprocessingSteps;
    private DataSplitResponse dataSplit;
    private List<DistributionResponse> distributions;
    private CorrelationMatrixResponse correlationMatrix;
}