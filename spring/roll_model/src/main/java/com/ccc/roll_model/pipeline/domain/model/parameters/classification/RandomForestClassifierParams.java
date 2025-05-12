package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class RandomForestClassifierParams implements ModelParameter {
	private Integer n_estimators;
	private Integer max_depth;
	private Integer max_features;

	@Override
	public boolean validateParameters() {
		return n_estimators != null && n_estimators > 0;
	}
}