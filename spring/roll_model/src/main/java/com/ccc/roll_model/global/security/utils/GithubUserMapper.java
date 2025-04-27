package com.ccc.roll_model.global.security.utils;

import java.util.Map;
import java.util.Objects;

import org.springframework.security.oauth2.core.user.OAuth2User;

public class GithubUserMapper implements ProviderUserMapper {
	@Override
	public Map<String, Object> mapAttributes(OAuth2User oauth2User) {
		System.out.println(oauth2User.toString());
		return Map.of(
			"email", oauth2User.getAttribute("email"),
			"name", oauth2User.getAttribute("login")
		);
	}
}