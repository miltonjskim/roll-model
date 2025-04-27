package com.ccc.roll_model.member.ui;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/auth")
public class MemberController {
	private final MemberService memberService;

	@PostMapping("/check")
	public void loginCheck(@AuthenticationPrincipal Integer memberId) {
		System.out.println("로그인 성공: "+ memberId);
	}
}
