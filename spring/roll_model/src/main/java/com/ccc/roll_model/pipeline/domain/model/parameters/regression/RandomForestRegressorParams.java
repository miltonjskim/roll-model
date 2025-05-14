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
	@Builder.Default
	private Integer n_estimators = 1;

	@Builder.Default
	private Integer max_depth = 10;

	@Builder.Default
	private Integer max_features = 2;

	@Override
	public boolean validateParameters() {
		if (n_estimators == null || n_estimators <= 0) {
			return false;
		}

		if (max_depth == null || max_depth <= 0) {
			return false;
		}

		return max_features != null && max_features > 0;
	}
}