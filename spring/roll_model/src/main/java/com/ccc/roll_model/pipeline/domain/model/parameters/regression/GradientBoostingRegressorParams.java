package com.ccc.roll_model.pipeline.domain.model.parameters.regression;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class GradientBoostingRegressorParams implements ModelParameter {
	private Integer n_estimators;
	private Double learning_rate;
	private Integer max_depth;

	@Override
	public boolean validateParameters() {
		// nEstimators가 필수 파라미터
		return n_estimators != null && n_estimators > 0;
	}
}