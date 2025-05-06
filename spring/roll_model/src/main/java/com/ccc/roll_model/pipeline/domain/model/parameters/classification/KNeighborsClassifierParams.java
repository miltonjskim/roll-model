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
public class KNeighborsClassifierParams implements ModelParameter {
	private Integer nNeighbors;
	private String weights;
	private String metric;

	@Override
	public boolean validateParameters() {
		return nNeighbors != null && nNeighbors > 0;
	}
}