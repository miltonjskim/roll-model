package com.ccc.roll_model.member.domain;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class Member {
	private Integer memberId;
	private String nickname;
	private String email;
	private Member.Provider provider;
	private LocalDateTime registeredAt;
	private LocalDateTime modifiedAt;
	private Boolean deletedYn;


	// Provider Enum
	public enum Provider {
		google, github
	}
}
