package com.ccc.roll_model.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
	// 공통 INPUT 에러
	INVALID_INPUT_PARAMETER(HttpStatus.BAD_REQUEST, "V001", "입력값이 유효하지 않습니다."),

	// 인증 관련
	ACCESS_DENIED(HttpStatus.FORBIDDEN, "A001", "접근 권한이 없습니다."),
	USER_NOT_FOUND(HttpStatus.NOT_FOUND, "A002", "유저를 찾을 수 없습니다."),
	AUTHENTICATION_FAILED(HttpStatus.BAD_REQUEST, "A003", "인증에 실패했습니다."),
	EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "A004", "만료된 토큰입니다."),
	INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A005", "토큰 검증에 실패했습니다."),

	// 파이프라인 관련
	PIPELINE_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "파이프라인을 찾을 수 없습니다."),
	PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "P002", "프로젝트를 찾을 수 없습니다."),
	PIPELINE_DATA_NOT_FOUND(HttpStatus.NOT_FOUND, "P003", "파이프라인 데이터를 찾을 수 없습니다."),
	PIPELINE_METADATA_NOT_FOUND(HttpStatus.NOT_FOUND, "P005", "파이프라인 메타데이터를 찾을 수 없습니다."),
	NO_MODEL_HISTORY_FOUND(HttpStatus.NOT_FOUND, "P006", "모델 학습 이력을 찾을 수 없습니다."),
	INVALID_PIPELINE_ID(HttpStatus.NOT_FOUND, "P007", "파이프라인 ID가 유효하지 않습니다."),

	// 모델 관련
	MODEL_NOT_FOUND(HttpStatus.NOT_FOUND, "M001", "모델을 찾을 수 없습니다."),
	MODEL_EXPORT_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "M002", "모델 내보내기에 실패했습니다."),
	INVALID_MODEL_PARAMETER(HttpStatus.BAD_REQUEST, "M003", "잘못된 모델 파라미터입니다."),
	INVALID_MODELING_STATUS(HttpStatus.BAD_REQUEST, "M004", "모델링이 이미 완료되었습니다."),
	MODEL_API_KEY_NOT_FOUND(HttpStatus.NOT_FOUND, "M005", "모델의 Api Key를 찾을 수 없습니다."),

	// AI
	AI_CHAT_FAILED(HttpStatus.BAD_REQUEST,"C001","AI 응답 생성에 실패했습니댜."),

	//Session
	SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "S001", "세션을 찾을 수 없습니다.")
	;
	private final HttpStatus status;
	private final String code;
	private final String message;

}