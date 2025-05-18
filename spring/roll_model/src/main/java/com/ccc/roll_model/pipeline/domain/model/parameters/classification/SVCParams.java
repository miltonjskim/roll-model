package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import java.util.Set;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
@AllArgsConstructor
public class SVCParams implements ModelParameter {

	@JsonProperty("C")
	private Double C;

	private String kernel;

	private String gamma;

	private Integer degree;

	@Override
	public boolean validateParameters() {
		// C 검증 - 양수여야 함
		if (C == null || C <= 0.0) {
			return false;
		}

		// kernel 검증 - 유효한 값들 중 하나여야 함
		if (kernel == null ||
			!Set.of("linear", "poly", "rbf", "sigmoid", "precomputed").contains(kernel.toLowerCase())) {
			return false;
		}

		// gamma 검증 - 'scale', 'auto' 또는 양수여야 함
		if (gamma != null) {
			if (!("scale".equalsIgnoreCase(gamma) || "auto".equalsIgnoreCase(gamma))) {
				try {
					double gammaValue = Double.parseDouble(gamma);
					if (gammaValue <= 0.0) {
						return false;
					}
				} catch (NumberFormatException e) {
					return false;
				}
			}
		}
		if (this.degree == null) {
			this.degree = 3;
		}

		// degree 검증 - 양의 정수여야 함
		return !"poly".equalsIgnoreCase(kernel) || degree > 0;
	}

	@JsonGetter("C")
	public Double getC() {
		return C;
	}
}