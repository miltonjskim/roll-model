package com.ccc.roll_model.global.security.utils;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.ccc.roll_model.global.config.AppConfig;
import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.global.utils.CookieUtils;
import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberRepository;
import com.ccc.roll_model.member.infrastructure.MemberEntity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;

@Component
@AllArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

	private final JWTUtils jwtUtils;
	private final MemberRepository memberRepository;
	private final AppConfig appConfig;

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws
		IOException, ServletException {
		System.out.println("여기는 성공 이후");
		OAuth2UserDetails userDetails = (OAuth2UserDetails) authentication.getPrincipal();

		Member member = memberRepository.findByEmail(userDetails.getMember().getEmail())
			.orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
		String accessToken = jwtUtils.createJwt(member, 360000000L);
		String refreshToken = jwtUtils.createJwt(member, 360000000L);

		CookieUtils.addRefreshTokenCookie(response, refreshToken);
		CookieUtils.addAccessTokenCookie(response, accessToken);

		response.sendRedirect(appConfig.getBaseUrl()+"/oauth/callback");
	}
}
