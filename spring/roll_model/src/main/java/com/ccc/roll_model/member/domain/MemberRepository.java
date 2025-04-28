package com.ccc.roll_model.member.domain;

import java.util.Optional;

public interface MemberRepository {
	Optional<Member> findByEmail(String email);
	Optional<Member> findById(Integer MemberId);
	Member save(Member member);
}
