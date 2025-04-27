package com.ccc.roll_model.global.utils;

import org.springframework.http.HttpStatus;

import com.ccc.roll_model.global.exception.ErrorCode;

import lombok.Getter;

public class ApiUtils {

	private static final String SUCCESS = "Success";
	private static final String FAILED = "Failed";

	// 성공 API 응답 생성
	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(HttpStatus.OK.value(), SUCCESS, data, null);
	}

	// 예외로 인한 오류 API 응답 생성
	public static ApiResponse<?> error(String code, Throwable throwable, HttpStatus status) {
		return new ApiResponse<>(
			status.value(),
			FAILED,
			null,
			new ApiError(code, throwable)
		);
	}

	// 메시지로 인한 오류 API 응답 생성
	public static ApiResponse<?> error(ErrorCode errorCode) {
		return new ApiResponse<>(
			errorCode.getStatus().value(),
			FAILED,
			null,
			new ApiError(errorCode)
		);
	}

	@Getter
	public static class ApiResponse<T> {

		private final int status;
		private final String message;
		private final T data;
		private final ApiError error;

		public ApiResponse(int status, String message, T data, ApiError error) {
			this.status = status;
			this.message = message;
			this.data = data;
			this.error = error;
		}

	}

	@Getter
	public static class ApiError {

		private final String code;
		private final String message;

		ApiError(ErrorCode errorCode) {
			this.code = errorCode.getCode();
			this.message = errorCode.getMessage();
		}

		ApiError(String code, Throwable throwable) {
			this.code = code;
			this.message = throwable.getMessage();
		}
	}
}