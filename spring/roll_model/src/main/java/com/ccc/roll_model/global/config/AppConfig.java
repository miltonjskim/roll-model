package com.ccc.roll_model.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

	@Value("${server.baseUrl}")
	private String baseUrl;

	public String getBaseUrl() {
		return baseUrl;
	}
}
