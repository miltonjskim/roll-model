package com.ccc.roll_model.member.domain;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.global.security.utils.JWTUtils;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class MemberService {
	private final MemberRepository memberRepository;
	private final JWTUtils jwtUtils;

	public Member findMemberByEmail(String email) {
		return memberRepository.findByEmail(email)
			.orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
	}

	public String getAccessToken(int memberId) {
		Member member = memberRepository.findById(memberId)
			.orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
		return jwtUtils.createJwt(member, 1000*60*60*72L);
	}
}
