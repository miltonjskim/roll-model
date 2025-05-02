package com.ccc.roll_model.global.security.utils;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.ccc.roll_model.member.domain.Member;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;

@Component
public class JWTUtils {
	private final SecretKey secretKey;

	public JWTUtils(@Value("${spring.jwt.secret_key}") String secret) {
		// 시크릿 키 생성 시 예외 처리 추가
		try {
			this.secretKey = new SecretKeySpec(
				secret.getBytes(StandardCharsets.UTF_8),
				Jwts.SIG.HS256.key().build().getAlgorithm()
			);
		} catch (Exception e) {
			throw new IllegalStateException("Failed to create JWT secret key", e);
		}
	}

	// Claims를 가져오는 공통 메서드
	private Claims getClaims(String token) {
		return Jwts.parser()
			.verifyWith(secretKey)
			.build()
			.parseSignedClaims(token)
			.getPayload();
	}

	// 각 claim을 가져오는 메서드들
	public Integer getMemberId(String token) {
		return getClaimOrDefault(token, Integer.class);
	}

	// Null-safe claim 조회 메서드
	private <T> T getClaimOrDefault(String token, Class<T> memberId) {
		Claims claims = getClaims(token);
		return claims.get("memberId", memberId);
	}

	public Boolean isExpired(String token) {
		try {
			return getClaims(token).getExpiration().before(new Date(System.currentTimeMillis()));
		} catch (ExpiredJwtException e) {
			return true;
		}
	}

	public String createJwt(Member member, Long expiredMs) {
		try {
			return Jwts.builder()
				.claim("memberId", member.getMemberId())
				.issuedAt(new Date(System.currentTimeMillis()))
				.expiration(new Date(System.currentTimeMillis() + expiredMs))
				.signWith(secretKey)
				.compact();
		} catch (Exception e) {
			throw new RuntimeException("Failed to create JWT", e);
		}
	}
}