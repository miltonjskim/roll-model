package com.ccc.roll_model.global.security.utils;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.security.oauth2.core.user.OAuth2User;

public class GithubUserMapper implements ProviderUserMapper {
	@Override
	public Map<String, Object> mapAttributes(OAuth2User oauth2User) {
		System.out.println(oauth2User.toString());
		return Map.of(
			"email",  Optional.ofNullable(oauth2User.getAttribute("email")).orElse(""),
			"name",  Optional.ofNullable(oauth2User.getAttribute("login")).orElse("")
		);
	}
}