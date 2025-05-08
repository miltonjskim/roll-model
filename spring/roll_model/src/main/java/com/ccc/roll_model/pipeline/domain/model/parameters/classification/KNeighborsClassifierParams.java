package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class KNeighborsClassifierParams implements ModelParameter {
	private Integer n_neighbors;
	private String weights;
	private String metric;

	@Override
	public boolean validateParameters() {
		return n_neighbors != null && n_neighbors > 0;
	}
}