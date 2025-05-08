package com.ccc.roll_model.pipeline.domain.model.parameters.regression;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class RandomForestRegressorParams implements ModelParameter {
	private Integer n_estimators;
	private Integer max_depth;
	private String max_features;

	@Override
	public boolean validateParameters() {
		// nEstimators가 필수 파라미터
		return n_estimators != null && n_estimators > 0;
	}
}