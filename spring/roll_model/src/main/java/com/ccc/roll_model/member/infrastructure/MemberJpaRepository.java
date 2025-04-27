package com.ccc.roll_model.member.infrastructure;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ccc.roll_model.member.domain.MemberRepository;

public interface MemberJpaRepository  extends JpaRepository<MemberEntity, Integer> {
	Optional<MemberEntity> findByEmail(String email);
}

