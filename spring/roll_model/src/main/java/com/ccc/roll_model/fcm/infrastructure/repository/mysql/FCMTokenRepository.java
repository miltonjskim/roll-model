package com.ccc.roll_model.fcm.infrastructure.repository.mysql;

import com.ccc.roll_model.fcm.infrastructure.entity.FCMTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FCMTokenRepository extends JpaRepository<FCMTokenEntity, Long> {

    List<FCMTokenEntity> findByMemberIdAndIsActiveTrue(Integer memberId);

    Optional<FCMTokenEntity> findByTokenAndIsActiveTrue(String token);

    Optional<FCMTokenEntity> findByMemberIdAndToken(Integer memberId, String token);

    void deleteByToken(String token);
}