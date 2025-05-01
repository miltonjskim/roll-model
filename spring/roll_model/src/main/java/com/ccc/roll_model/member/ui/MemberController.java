package com.ccc.roll_model.member.ui;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class MemberController {
	private final MemberService memberService;

	@GetMapping("/token/{memberId}")
	public String getAccessToken(@PathVariable Integer memberId) {
		return memberService.getAccessToken(memberId);
	}
}
