package com.ccc.roll_model.global.utils;

import java.io.IOException;

import org.springframework.http.HttpStatus;

import com.ccc.roll_model.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JsonResponseUtils {

	private static final ObjectMapper objectMapper = new ObjectMapper();

	public static void sendJsonResponse(HttpServletRequest request, HttpServletResponse response, HttpStatus status, Object responseData) throws IOException {
		response.setStatus(status.value());
		response.setHeader("Access-Control-Allow-Origin", request.getHeader("Origin"));
		response.setHeader("Access-Control-Allow-Credentials", "true");
		response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
		response.setContentType("application/json; charset=UTF-8");
		response.getWriter().write(objectMapper.writeValueAsString(responseData));
		response.getWriter().flush();
	}

	public static void sendJsonErrorResponse(HttpServletRequest request, HttpServletResponse response, ErrorCode errorCode) throws
		IOException {
			sendJsonResponse(request, response, errorCode.getStatus(), ApiUtils.error(errorCode));
		}
}
