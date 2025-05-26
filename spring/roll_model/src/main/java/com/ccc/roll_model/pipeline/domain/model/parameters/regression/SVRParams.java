package com.ccc.roll_model.pipeline.domain.model.parameters.regression;

import java.util.Set;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@AllArgsConstructor
public class SVRParams implements ModelParameter {

	@JsonProperty("C")
	private Double C;

	private Double epsilon;

	private String kernel;

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

	@JsonGetter("C")
	public Double getC() {
		return C;
	}
}