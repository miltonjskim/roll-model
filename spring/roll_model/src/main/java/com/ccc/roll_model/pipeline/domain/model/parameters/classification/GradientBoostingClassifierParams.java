package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import java.util.Map;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradientBoostingClassifierParams implements ModelParameter {
	private Integer n_estimators;
	private Double learning_rate;
	private Integer max_depth;

	@Override
	public boolean validateParameters() {
		return n_estimators != null && n_estimators > 0;
	}
}