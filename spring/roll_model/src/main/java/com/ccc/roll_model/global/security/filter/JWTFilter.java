package com.ccc.roll_model.global.security.filter;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.ccc.roll_model.global.security.utils.JWTUtils;
import com.ccc.roll_model.member.domain.Member;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JWTFilter extends OncePerRequestFilter {

	private final JWTUtils jwtUtils;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {

		// 1. 토큰이 필요하지 않은 API URL 리스트
		List<String> allowedPaths = Arrays.asList(
			"/api/auth/**",
			"/api/login/**"
		);

		// 2. 토큰이 필요하지 않은 URL이나 OPTIONS 요청일 경우 그냥 통과
		String path = request.getServletPath();
		if (isPathAllowed(path, allowedPaths) || request.getMethod().equalsIgnoreCase("OPTIONS")) {
			String authorization = request.getHeader("Authorization");

			// 토큰이 없거나 Bearer 형식이 아닌 경우
			if (authorization == null || !authorization.startsWith("Bearer ")) {
				filterChain.doFilter(request, response);
				return;
			}

			// Bearer 부분 제거 후 순수 토큰만 획득
			String token = authorization.split(" ")[1];

			// 토큰에서 사용자 정보 추출 및 인증
			Integer memberId = jwtUtils.getMemberId(token);

			// 스프링 시큐리티 인증 토큰 생성
			Authentication authToken = new UsernamePasswordAuthenticationToken(
				memberId, null, List.of(new SimpleGrantedAuthority("USER"))
			);

			// 세션에 사용자 등록
			SecurityContextHolder.getContext().setAuthentication(authToken);

			filterChain.doFilter(request, response);
			return;
		}

		// 3. Authorization 헤더에서 토큰 추출
		try {
			String authorization = request.getHeader("Authorization");

			// 토큰이 없거나 Bearer 형식이 아닌 경우
			if (authorization == null) {
				throw new JwtException("empty");
			} else if (!authorization.startsWith("Bearer ")) {
				throw new JwtException("invalid");
			}

			// Bearer 부분 제거 후 순수 토큰만 획득
			String token = authorization.split(" ")[1];

			// 토큰 소멸 시간 검증
			if (jwtUtils.isExpired(token)) {
				log.debug("Token expired");
				throw new JwtException("Token expired");
			}

			// 토큰에서 사용자 정보 추출 및 인증
			Integer memberId = jwtUtils.getMemberId(token);

			// 스프링 시큐리티 인증 토큰 생성
			Authentication authToken = new UsernamePasswordAuthenticationToken(
				memberId, null, List.of(new SimpleGrantedAuthority("USER"))
			);

			// 세션에 사용자 등록
			SecurityContextHolder.getContext().setAuthentication(authToken);

			// 인증 성공 시 필터 체인 계속 진행
			filterChain.doFilter(request, response);

		} catch (Exception e) {
			// 토큰 관련 예외 처리 및 응답
			log.error("Authentication error: {}", e.getMessage());

			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			response.setContentType("application/json;charset=UTF-8");

			String errorMessage = "인증에 실패했습니다";
			String errorCode = "AUTHENTICATION_FAILED";

			if (e instanceof JwtException) {
				if (e.getMessage().contains("expired")) {
					errorMessage = "토큰이 만료되었습니다";
					errorCode = "EXPIRED_TOKEN";
				} else if (e.getMessage().contains("empty")) {
					errorMessage = "토큰이 없습니다";
					errorCode = "EMPTY_TOKEN";
				} else {
					errorMessage = "유효하지 않은 토큰입니다";
					errorCode = "INVALID_TOKEN";
				}
			}

			PrintWriter writer = response.getWriter();
			ObjectMapper mapper = new ObjectMapper();

			Map<String, Object> errorResponse = new HashMap<>();
			errorResponse.put("status", 401);
			errorResponse.put("error", true);
			errorResponse.put("code", errorCode);
			errorResponse.put("message", errorMessage);

			writer.write(mapper.writeValueAsString(errorResponse));
			writer.flush();
			writer.close();
		}
	}

	/**
	 * 주어진 경로가 허용된 경로 패턴 중 하나와 일치하는지 확인
	 */
	private boolean isPathAllowed(String requestPath, List<String> allowedPaths) {
		AntPathMatcher pathMatcher = new AntPathMatcher();
		return allowedPaths.stream()
			.anyMatch(pattern -> pathMatcher.match(pattern, requestPath));
	}
}