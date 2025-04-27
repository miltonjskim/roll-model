package com.ccc.roll_model.global.security.utils;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.global.utils.JsonResponseUtils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws
		IOException {
		System.out.println("JwtAuthenticationEntryPoint commence");
		if (request.getAttribute("expiredTokenException") != null) {
			JsonResponseUtils.sendJsonErrorResponse(request, response, ErrorCode.EXPIRED_TOKEN);
		}
		else if(request.getAttribute("invalidTokenException") != null){
			JsonResponseUtils.sendJsonErrorResponse(request, response, ErrorCode.INVALID_TOKEN);
		}else{
			JsonResponseUtils.sendJsonErrorResponse(request, response, ErrorCode.AUTHENTICATION_FAILED);
		}

		response.getWriter().flush();
	}
}
