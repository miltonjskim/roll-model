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
	 * 알고리즘 이름과 파라미터 맵을 기반으로 적절한 모델 파라미터 객체를 생성합니다.
	 *
	 * @param algorithm 알고리즘 이름
	 * @param parameterMap 파라미터 맵
	 * @return 모델 파라미터 객체
	 * @throws IllegalArgumentException 알 수 없는 알고리즘 또는 파라미터 변환 오류 발생 시
	 */
	public static ModelParameter createModelParameters(String algorithm, Map<String, Object> parameterMap) {
		try {
			ModelType modelType = ModelType.fromString(algorithm);
			return createModelParameters(modelType, parameterMap);
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("지원하지 않는 알고리즘입니다: " + algorithm, e);
		}
	}

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
			switch (modelType) {
				// 분류 모델들
				case LOGISTIC_REGRESSION:
					return objectMapper.convertValue(parameterMap, LogisticRegressionParams.class);
				case SVC:
					return objectMapper.convertValue(parameterMap, SVCParams.class);
				case K_NEIGHBORS_CLASSIFIER:
					return objectMapper.convertValue(parameterMap, KNeighborsClassifierParams.class);
				case RANDOM_FOREST_CLASSIFIER:
					return objectMapper.convertValue(parameterMap, RandomForestClassifierParams.class);
				case GRADIENT_BOOSTING_CLASSIFIER:
					return objectMapper.convertValue(parameterMap, GradientBoostingClassifierParams.class);

				// 회귀 모델들
				case ELASTIC_NET:
					return objectMapper.convertValue(parameterMap, ElasticNetParams.class);
				case SVR:
					return objectMapper.convertValue(parameterMap, SVRParams.class);
				case RANDOM_FOREST_REGRESSOR:
					return objectMapper.convertValue(parameterMap, RandomForestRegressorParams.class);
				case GRADIENT_BOOSTING_REGRESSOR:
					return objectMapper.convertValue(parameterMap, GradientBoostingRegressorParams.class);

				default:
					throw new IllegalArgumentException("지원하지 않는 모델 유형입니다: " + modelType);
			}
		} catch (IllegalArgumentException e) {
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
}