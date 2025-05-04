package com.ccc.roll_model.global.security.utils;

import java.io.IOException;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.global.utils.JsonResponseUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

	@Override
	public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws
		IOException,
		ServletException,
		IOException {
		JsonResponseUtils.sendJsonErrorResponse(request, response, ErrorCode.ACCESS_DENIED);
	}
}

