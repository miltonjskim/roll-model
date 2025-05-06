package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RandomForestClassifierParams implements ModelParameter {
	private Integer nEstimators;
	private Integer maxDepth;
	private String maxFeatures;

	@Override
	public boolean validateParameters() {
		return nEstimators != null && nEstimators > 0;
	}
}