package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import java.util.Map;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class GradientBoostingClassifierParams implements ModelParameter {
	@Builder.Default
	private Integer n_estimators = 1;

	@Builder.Default
	private Double learning_rate = 0.1;

	@Builder.Default
	private Integer max_depth = 10;

	@Override
	public boolean validateParameters() {

		if (n_estimators == null || n_estimators <= 0) {
			return false;
		}

		if (learning_rate == null || (learning_rate <= 0.0 || learning_rate > 1.0)) {
			return false;
		}

		return max_depth != null && max_depth > 0;
	}
}