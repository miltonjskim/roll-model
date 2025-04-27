package com.ccc.roll_model.global.security.utils;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.infrastructure.MemberEntity;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public class OAuth2UserDetails implements OAuth2User, UserDetails {
	private final Member member;

	@Override
	public Map<String, Object> getAttributes() {
		return Map.of();
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of();
	}

	@Override
	public String getPassword() {
		return "";
	}

	@Override
	public String getUsername() {
		return member.getNickname();
	}

	@Override
	public String getName() {
		return member.getNickname();
	}

	public Member getMember() {
		return member;
	}
}
