package com.ccc.roll_model.member.domain;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;

@Service
@Transactional
public class MemberService {
	MemberRepository memberRepository;
	public Member findMemberByEmail(String email) {
		return memberRepository.findByEmail(email)
			.orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
	}
}
