package com.ccc.roll_model.project.infrastructure.entity;

import com.ccc.roll_model.member.infrastructure.MemberEntity;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class ProjectEntity {

    @Id
    @Column(name = "project_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @NotNull
    private Integer projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    @NotNull
    private MemberEntity memberId;

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

    @Column(name = "registered_at")
    @NotNull
    private LocalDateTime registeredAt;

    @Column(name = "modified_at")
    @NotNull
    private LocalDateTime modifiedAt;

    @Column(name = "deleted_at")
    @Nullable
    private LocalDateTime deletedAt;

    @Builder
    public ProjectEntity(MemberEntity memberId, String title, String description, Category category, Domain domain) {

        this.memberId = memberId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.domain = domain;
    }
}
