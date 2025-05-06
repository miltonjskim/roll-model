package com.ccc.roll_model.pipeline.application;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.ccc.roll_model.pipeline.domain.model.common.ModelType;
import com.ccc.roll_model.pipeline.domain.model.parameters.classification.GradientBoostingClassifierParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.classification.KNeighborsClassifierParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.classification.LogisticRegressionParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.classification.RandomForestClassifierParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.classification.SVCParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.regression.ElasticNetParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.regression.GradientBoostingRegressorParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.regression.RandomForestRegressorParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.regression.SVRParams;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

public class ModelParameterFactory {

	private static final ObjectMapper objectMapper = new ObjectMapper();

	/**
	 * 모델 유형과 파라미터 맵을 기반으로 적절한 모델 파라미터 객체를 생성합니다.
	 *
	 * @param modelType 모델 유형
	 * @param parameterMap 파라미터 맵
	 * @return 모델 파라미터 객체
	 * @throws IllegalArgumentException 파라미터 변환 오류 발생 시
	 */
	public static ModelParameter createModelParameters(ModelType modelType, Map<String, Object> parameterMap) {
		try {
			return switch (modelType) {
				case LOGISTIC_REGRESSION -> LogisticRegressionParams.builder()
					.penalty(getStringValue(parameterMap, "penalty"))
					.c(getDoubleValue(parameterMap, "C"))
					.solver(getStringValue(parameterMap, "solver"))
					.max_iter(getIntegerValue(parameterMap, "maxIter"))
					.build();
				case SVC -> SVCParams.builder()
					.c(getDoubleValue(parameterMap, "C"))
					.kernel(getStringValue(parameterMap, "kernel"))
					.gamma(getStringValue(parameterMap, "gamma"))
					.degree(getIntegerValue(parameterMap, "degree"))
					.build();
				case K_NEIGHBORS_CLASSIFIER -> KNeighborsClassifierParams.builder()
					.n_neighbors(getIntegerValue(parameterMap, "nNeighbors"))
					.weights(getStringValue(parameterMap, "weights"))
					.metric(getStringValue(parameterMap, "metric"))
					.build();
				case RANDOM_FOREST_CLASSIFIER -> RandomForestClassifierParams.builder()
					.n_estimators(getIntegerValue(parameterMap, "nEstimators"))
					.max_depth(getIntegerValue(parameterMap, "maxDepth"))
					.max_features(getStringValue(parameterMap, "maxFeatures"))
					.build();
				case GRADIENT_BOOSTING_CLASSIFIER -> GradientBoostingClassifierParams.builder()
					.n_estimators(getIntegerValue(parameterMap, "nEstimators"))
					.learning_rate(getDoubleValue(parameterMap, "learningRate"))
					.max_depth(getIntegerValue(parameterMap, "maxDepth"))
					.build();
				case ELASTIC_NET -> ElasticNetParams.builder()
					.alpha(getDoubleValue(parameterMap, "alpha"))
					.l1_ratio(getDoubleValue(parameterMap, "l1Ratio"))
					.build();
				case SVR -> SVRParams.builder()
					.c(getDoubleValue(parameterMap, "C"))
					.epsilon(getDoubleValue(parameterMap, "epsilon"))
					.kernel(getStringValue(parameterMap, "kernel"))
					.build();
				case RANDOM_FOREST_REGRESSOR -> RandomForestRegressorParams.builder()
					.n_estimators(getIntegerValue(parameterMap, "nEstimators"))
					.max_depth(getIntegerValue(parameterMap, "maxDepth"))
					.max_features(getStringValue(parameterMap, "maxFeatures"))
					.build();
				case GRADIENT_BOOSTING_REGRESSOR -> GradientBoostingRegressorParams.builder()
					.n_estimators(getIntegerValue(parameterMap, "nEstimators"))
					.learning_rate(getDoubleValue(parameterMap, "learningRate"))
					.max_depth(getIntegerValue(parameterMap, "maxDepth"))
					.build();
				default -> throw new IllegalArgumentException("지원하지 않는 모델 유형입니다: " + modelType);
			};
		} catch (Exception e) {
			throw new IllegalArgumentException("파라미터 변환 중 오류가 발생했습니다: " + e.getMessage(), e);
		}
	}

	/**
	 * 생성된 모델 파라미터 객체를 검증합니다.
	 *
	 * @param modelParameter 검증할 모델 파라미터 객체
	 * @return 검증 결과 (true: 유효함, false: 유효하지 않음)
	 */
	public static boolean validateModelParameters(ModelParameter modelParameter) {
		if (modelParameter == null) {
			return false;
		}

		return modelParameter.validateParameters();
	}

	private static Integer getIntegerValue(Map<String, Object> map, String key) {
		Object value = map.get(key);
		if (value == null) {
			return null;
		}
		if (value instanceof Integer) {
			return (Integer) value;
		}
		if (value instanceof Number) {
			return ((Number) value).intValue();
		}
		if (value instanceof String) {
			try {
				return Integer.parseInt((String) value);
			} catch (NumberFormatException e) {
				throw new IllegalArgumentException("Cannot convert String value '" + value + "' to Integer for key '" + key + "'");
			}
		}
		throw new IllegalArgumentException("Cannot convert value of type " + value.getClass().getName() + " to Integer for key '" + key + "'");
	}

	private static Double getDoubleValue(Map<String, Object> map, String key) {
		Object value = map.get(key);
		if (value == null) {
			return null;
		}
		if (value instanceof Double) {
			return (Double) value;
		}
		if (value instanceof Number) {
			return ((Number) value).doubleValue();
		}
		if (value instanceof String) {
			try {
				return Double.parseDouble((String) value);
			} catch (NumberFormatException e) {
				throw new IllegalArgumentException("Cannot convert String value '" + value + "' to Double for key '" + key + "'");
			}
		}
		throw new IllegalArgumentException("Cannot convert value of type " + value.getClass().getName() + " to Double for key '" + key + "'");
	}

	private static String getStringValue(Map<String, Object> map, String key) {
		Object value = map.get(key);
		if (value == null) {
			return null;
		}
		return value.toString();
	}
}