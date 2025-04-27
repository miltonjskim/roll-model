package com.ccc.roll_model;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication(exclude = SecurityAutoConfiguration.class)
public class RollModelApplication {

	public static void main(String[] args) {
		SpringApplication.run(RollModelApplication.class, args);
	}

}
