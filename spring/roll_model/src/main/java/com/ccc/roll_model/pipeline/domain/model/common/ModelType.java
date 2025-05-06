package com.ccc.roll_model.pipeline.domain.model.common;

public enum ModelType {
	// 분류 모델 유형
	LOGISTIC_REGRESSION("LogisticRegression", ModelCategory.CLASSIFICATION),
	SVC("SVC", ModelCategory.CLASSIFICATION),
	K_NEIGHBORS_CLASSIFIER("KNeighborsClassifier", ModelCategory.CLASSIFICATION),
	RANDOM_FOREST_CLASSIFIER("RandomForestClassifier", ModelCategory.CLASSIFICATION),
	GRADIENT_BOOSTING_CLASSIFIER("GradientBoostingClassifier", ModelCategory.CLASSIFICATION),

	// 회귀 모델 유형
	ELASTIC_NET("ElasticNet", ModelCategory.REGRESSION),
	SVR("SVR", ModelCategory.REGRESSION),
	RANDOM_FOREST_REGRESSOR("RandomForestRegressor", ModelCategory.REGRESSION),
	GRADIENT_BOOSTING_REGRESSOR("GradientBoostingRegressor", ModelCategory.REGRESSION);

	private final String algorithmName;
	private final ModelCategory category;

	ModelType(String algorithmName, ModelCategory category) {
		this.algorithmName = algorithmName;
		this.category = category;
	}

	public String getAlgorithmName() {
		return algorithmName;
	}

	public ModelCategory getCategory() {
		return category;
	}

	public static ModelType fromString(String algorithmName) {
		for (ModelType type : ModelType.values()) {
			if (type.algorithmName.equalsIgnoreCase(algorithmName)) {
				return type;
			}
		}
		throw new IllegalArgumentException("Unknown algorithm: " + algorithmName);
	}

	public boolean isClassification() {
		return this.category == ModelCategory.CLASSIFICATION;
	}

	public boolean isRegression() {
		return this.category == ModelCategory.REGRESSION;
	}

	public enum ModelCategory {
		CLASSIFICATION,
		REGRESSION
	}
}