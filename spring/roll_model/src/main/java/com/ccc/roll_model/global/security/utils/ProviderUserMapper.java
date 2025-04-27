package com.ccc.roll_model.global.security.utils;

import java.util.Map;

import org.springframework.security.oauth2.core.user.OAuth2User;

public interface ProviderUserMapper {
	Map<String, Object> mapAttributes(OAuth2User oauth2User);
}

