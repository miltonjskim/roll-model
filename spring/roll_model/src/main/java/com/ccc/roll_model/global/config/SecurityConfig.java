package com.ccc.roll_model.global.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.OAuth2AuthorizationFailureHandler;
import org.springframework.security.oauth2.client.OAuth2AuthorizationSuccessHandler;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.ccc.roll_model.global.security.filter.JWTFilter;
import com.ccc.roll_model.global.security.utils.JwtAccessDeniedHandler;
import com.ccc.roll_model.global.security.utils.JwtAuthenticationEntryPoint;
import com.ccc.roll_model.global.security.utils.OAuth2FailureHandler;
import com.ccc.roll_model.global.security.utils.OAuth2SuccessHandler;

import io.jsonwebtoken.Jwt;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity // 스프링 시큐리티 어노테이션 활성화를 위해서
public class SecurityConfig {

	private final JWTFilter jwtFilter;
	private final DefaultOAuth2UserService defaultOAuth2UserService;
	private final OAuth2SuccessHandler oAuth2SuccessHandler;
	private final OAuth2FailureHandler oAuth2FailureHandler;
	private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
	private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		return http.csrf(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable)
			.httpBasic(AbstractHttpConfigurer::disable)
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.authorizeHttpRequests((auth) -> auth
				.requestMatchers(HttpMethod.GET).permitAll()
				.requestMatchers(HttpMethod.POST).permitAll()
				.anyRequest().permitAll()
			)
			// 인가 stateless
			.sessionManagement((session)
				-> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
			)
			.exceptionHandling(exceptions -> exceptions
				.authenticationEntryPoint(jwtAuthenticationEntryPoint)  // 인증 실패 처리
				.accessDeniedHandler(jwtAccessDeniedHandler)           // 인가 실패 처리
			)
			// OAuth2 로그인 설정
			.oauth2Login(oauth -> oauth
				.authorizationEndpoint(authorization -> authorization
					.baseUri("/api/oauth2/authorization")
				)
				.redirectionEndpoint(redirectionEndpointConfig -> redirectionEndpointConfig
					.baseUri("/api/login/oauth2/code/*")
				)
				.userInfoEndpoint(user -> user
					.userService(defaultOAuth2UserService)
				)
				.successHandler(oAuth2SuccessHandler)
				.failureHandler(oAuth2FailureHandler)
			)
			.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
			.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(Arrays.asList("*")); // 모든 출처 허용 (추후 수정!!)
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE"));
		configuration.setAllowedHeaders(Arrays.asList("*"));
		configuration.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration); // 모든 경로에 대해 이 설정 적용
		return source;
	}
}
