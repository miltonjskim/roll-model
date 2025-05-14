package com.ccc.roll_model.pipeline.domain.model.parameters.regression;

import java.util.Set;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class SVRParams implements ModelParameter {

	@Builder.Default
	private Double C = 1.0;

	@Builder.Default
	private Double epsilon = 0.1;

	@Builder.Default
	private String kernel = "rbf";

	@Override
	public boolean validateParameters() {
		if (C == null || C <= 0) {
			return false;
		}

		if (epsilon != null && epsilon < 0) {
			return false;
		}

		return kernel == null || Set.of("linear", "rbf", "poly", "sigmoid").contains(kernel.toLowerCase());
	}
}