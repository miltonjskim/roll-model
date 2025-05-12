package com.ccc.roll_model.fcm.infrastructure.entity;

import com.ccc.roll_model.global.entity.BaseCreatedAndUpdatedEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;

@Entity
@Table(name = "fcm_tokens")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FCMTokenEntity extends BaseCreatedAndUpdatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "token", nullable = false, length = 255)
    private String token;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    public void updateToken(String token) {
        this.token = token;
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }
}