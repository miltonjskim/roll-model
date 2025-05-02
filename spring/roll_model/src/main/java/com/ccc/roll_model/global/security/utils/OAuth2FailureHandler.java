package com.ccc.roll_model.global.security.utils;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import com.ccc.roll_model.global.config.AppConfig;
import com.ccc.roll_model.global.exception.ErrorCode;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2FailureHandler implements AuthenticationFailureHandler {
	private final AppConfig appConfig;

	@Override
	public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws
		IOException, ServletException {
		String errorMessage = ErrorCode.AUTHENTICATION_FAILED.getMessage();
		String errorCode = ErrorCode.AUTHENTICATION_FAILED.getCode();

		if (exception instanceof OAuth2AuthenticationException authEx) {
			String[] errorParts = authEx.getMessage().split(":", 2);
			if (errorParts.length == 2) {
				errorCode = errorParts[0];
				errorMessage = errorParts[1];
			}
		}

		String encodedMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
		String encodedErrorCode = URLEncoder.encode(errorCode, StandardCharsets.UTF_8);

		String redirectUrl = appConfig.getBaseUrl() + "/";
		response.sendRedirect(redirectUrl);
	}
}

