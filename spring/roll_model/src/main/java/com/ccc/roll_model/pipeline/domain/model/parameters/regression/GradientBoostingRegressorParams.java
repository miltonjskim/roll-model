package com.ccc.roll_model.pipeline.domain.model.parameters.regression;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradientBoostingRegressorParams implements ModelParameter {
	private Integer nEstimators;
	private Double learningRate;
	private Integer maxDepth;

	@Override
	public boolean validateParameters() {
		// nEstimators가 필수 파라미터
		return nEstimators != null && nEstimators > 0;
	}
}