package com.ccc.roll_model.global.utils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

import java.util.Arrays;
import java.util.Optional;

public class CookieUtils {
	public static void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
		ResponseCookie cookie = ResponseCookie.from(name, value)
			.httpOnly(false)
			.secure(false)
			.path("/")
			.maxAge(maxAge)
			.sameSite("Lax")
			.build();

		response.addHeader("Set-Cookie", cookie.toString());
	}

	/**
	 * Refresh Token 쿠키 생성
	 */
	public static void addAccessTokenCookie(HttpServletResponse response, String token) {
		addCookie(response, "access_token", token, 24 * 60 * 60);
	}


	/**
	 * Refresh Token 쿠키 생성
	 */
	public static void addRefreshTokenCookie(HttpServletResponse response, String token) {
		addCookie(response, "refresh_token", token, 7 * 24 * 60 * 60);
	}

	/**
	 * 쿠키 삭제
	 */
	public static void removeCookie(HttpServletResponse response, String name) {
		addCookie(response, name, null, 0);
	}


	/**
	 * 헤더에서 액세스 토큰 추출
	 */
	public static Optional<String> getAccessToken(HttpServletRequest request) {
		if (request.getCookies() == null) {
			return Optional.empty();
		}
		return Arrays.stream(request.getCookies())
			.filter(cookie -> "access_token".equals(cookie.getName()))
			.map(Cookie::getValue)
			.findFirst();
	}


	/***
	 * 쿠키에서 리프레시 토큰 추출
	 */
	public static Optional<String> getRefreshToken(HttpServletRequest request) {
		if (request.getCookies() == null) {
			return Optional.empty();
		}
		return Arrays.stream(request.getCookies())
			.filter(cookie -> "refresh_token".equals(cookie.getName()))
			.map(Cookie::getValue)
			.findFirst();
	}
}
