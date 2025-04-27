package com.ccc.roll_model.global.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class SwaggerConfig {

	@Bean
	public OpenAPI openAPI() {
		SecurityScheme jwtScheme = new SecurityScheme()
			.type(SecurityScheme.Type.HTTP)
			.scheme("bearer")
			.bearerFormat("JWT") // JWT 형식임을 명시
			.name("Authorization");

		SecurityRequirement securityRequirement = new SecurityRequirement().addList("BearerAuth");

		Info info = new Info().title("API 명세서").description(
				"<h3> API 명세서 </h3>")
			.version("v1").contact(new io.swagger.v3.oas.models.info.Contact());

		return new OpenAPI()
			.components(new Components().addSecuritySchemes("BearerAuth", jwtScheme))
			.info(info)
			.addSecurityItem(securityRequirement);
	}

	@Bean
	public GroupedOpenApi publicApi() {
		return GroupedOpenApi.builder().group("public").pathsToMatch("/**").build();
	}
}