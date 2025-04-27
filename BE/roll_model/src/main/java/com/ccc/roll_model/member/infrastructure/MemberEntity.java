package com.ccc.roll_model.member.infrastructure;

import java.time.LocalDateTime;

import com.ccc.roll_model.global.entity.BaseCreatedAndUpdatedEntity;
import com.ccc.roll_model.member.domain.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "members")
@Getter
@SuperBuilder(toBuilder = true)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberEntity extends BaseCreatedAndUpdatedEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "member_id")
	private Integer memberId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Member.Provider provider;

	private String nickname;

	@Column(length = 30, nullable = false)
	private String email;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	public void delete() {
		this.deletedAt = LocalDateTime.now();
	}
}