package com.ccc.roll_model.pipeline.domain.model.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelingInfo {
	private String algorithm;
	private DataSplit dataSplit;
	private Map<String, Object> parameters;
	private String targetFeature;

	public boolean isValid() {
		if (algorithm == null || algorithm.isEmpty()) {
			return false;
		}

		if (targetFeature == null || targetFeature.isEmpty()) {
			return false;
		}

		if (dataSplit == null) {
			return false;
		}

		return dataSplit.isValid();
	}

	public ModelType getModelType() {
		return ModelType.fromString(algorithm);
	}

	public boolean isClassification() {
		return getModelType().isClassification();
	}

	public boolean isRegression() {
		return getModelType().isRegression();
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class DataSplit {
		private double trainRatio;
		private double testRatio;
		private double validationRatio;
		private int randomSeed;

		public boolean isValid() {
			if (trainRatio <= 0.0 || trainRatio > 1.0) {
				return false;
			}

			if (testRatio < 0.0 || testRatio >= 1.0) {
				return false;
			}

			if (validationRatio < 0.0 || validationRatio >= 1.0) {
				return false;
			}

			double sum = trainRatio + testRatio + validationRatio;
			return Math.abs(sum - 1.0) < 0.001;
		}
	}
}