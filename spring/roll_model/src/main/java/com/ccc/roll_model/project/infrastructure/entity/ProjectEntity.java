package com.ccc.roll_model.project.infrastructure.entity;

import com.ccc.roll_model.global.entity.BaseCreatedAndUpdatedEntity;
import com.ccc.roll_model.member.infrastructure.MemberEntity;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
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

    @Column(name = "category")
    @NotNull
    private Category category;

    @Column(name = "domain")
    @NotNull
    private Domain domain;

    @Column(name = "deleted_at")
    @Nullable
    private LocalDateTime deletedAt;

    @Builder
    public ProjectEntity(MemberEntity memberEntity, String title, String description, Category category, Domain domain) {

        this.memberEntity = memberEntity;
        this.title = title;
        this.description = description;
        this.category = category;
        this.domain = domain;
    }
}
