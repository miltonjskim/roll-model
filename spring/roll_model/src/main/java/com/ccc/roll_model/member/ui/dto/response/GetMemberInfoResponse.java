package com.ccc.roll_model.member.ui.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

import com.ccc.roll_model.member.domain.Member;

@Getter
@Builder
public class GetMemberInfoResponse {
	private Integer memberId;
	private String nickname;
	private String email;
	private String provider;
	private LocalDateTime registeredAt;
	private LocalDateTime modifiedAt;
	private Boolean isActive;

	/**
	 * Member 엔티티로부터 MemberInfoResponse DTO를 생성하는 정적 팩토리 메서드
	 *
	 * @param member 변환할 Member 엔티티
	 * @return 생성된 MemberInfoResponse 객체
	 */
	public static GetMemberInfoResponse from(Member member) {
		return GetMemberInfoResponse.builder()
			.memberId(member.getMemberId())
			.nickname(member.getNickname())
			.email(member.getEmail())
			.provider(member.getProvider().name())
			.registeredAt(member.getRegisteredAt())
			.modifiedAt(member.getModifiedAt())
			.isActive(!member.getDeletedYn())
			.build();
	}
}