package com.ccc.roll_model.global.config;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AIConfig {

	@Value("${spring.ai.openai.api-key}")
	String openAIKey;

	@Bean
	@Primary
	public ChatModel openAIChatModel(OpenAiApi openAIApi) {
		return new OpenAiChatModel(openAIApi);
	}

	@Bean
	public OpenAiApi openAIApi() {
		return new OpenAiApi(openAIKey); // 환경변수에서 API 키를 가져옴
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}
}
