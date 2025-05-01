package com.ccc.roll_model.project.infrastructure.entity.mysql;

//- 프로젝트 기본 정보(ID, 제목, 설명) 필드 추가
//- 회원과의 다대일 관계 설정
//- 카테고리 및 도메인 열거형 필드 추가
//- 논리적 삭제를 위한 deletedAt 필드 추가
//- BaseCreatedAndUpdatedEntity 상속으로 생성/수정 시간 관리

import com.ccc.roll_model.global.entity.BaseCreatedAndUpdatedEntity;
import com.ccc.roll_model.member.infrastructure.MemberEntity;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "projects")
@Getter
@NoArgsConstructor
@SuperBuilder
public class ProjectEntity extends BaseCreatedAndUpdatedEntity {

    @Id
    @Column(name = "project_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    @NotNull
    private MemberEntity memberEntity;

    @Column(name = "title")
    @NotNull
    private String title;

    @Column(name = "description")
    @Nullable
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    @NotNull
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "domain", nullable = false)
    @NotNull
    private Domain domain;

    @Column(name = "deleted_yn")
    @Nullable
    private Boolean deletedYn;

    @Column(name = "public_yn", nullable = false)
    private Boolean publicYn = false;
}