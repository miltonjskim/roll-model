package com.ccc.roll_model.member.infrastructure;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberRepository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class MemberRepositoryImpl implements MemberRepository {
	private final MemberJpaRepository memberJpaRepository;
	private final MemberMapper memberMapper;

	@Override
	public Optional<Member> findByEmail(String email) {
		return memberJpaRepository.findByEmail(email)
			.map(memberMapper::toMember);
	}

	@Override
	public Member save(Member member) {
		MemberEntity memberEntity = memberMapper.toEntity(member);
		return memberMapper.toMember(memberJpaRepository.save(memberEntity));
	}
}
