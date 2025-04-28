package com.ccc.roll_model.member.infrastructure;

import org.springframework.stereotype.Component;

import com.ccc.roll_model.member.domain.Member;

import lombok.Builder;

@Component
public class MemberMapper {

	public Member toMember(MemberEntity entity) {
		return Member.builder()
				.memberId(entity.getMemberId())
				.nickname(entity.getNickname())
				.email(entity.getEmail())
				.provider(entity.getProvider())
				.registeredAt(entity.getRegisteredAt())
				.modifiedAt(entity.getModifiedAt())
				.deletedAt(entity.getDeletedAt())
				.build();
	}

	public MemberEntity toEntity(Member member) {
		return MemberEntity.builder()
				.memberId(member.getMemberId())
				.nickname(member.getNickname())
				.email(member.getEmail())
				.provider(member.getProvider())
				.registeredAt(member.getRegisteredAt())
				.modifiedAt(member.getModifiedAt())
				.deletedAt(member.getDeletedAt())
				.build();
	}
}
