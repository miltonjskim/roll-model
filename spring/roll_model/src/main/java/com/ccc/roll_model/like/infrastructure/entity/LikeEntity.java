package com.ccc.roll_model.like.infrastructure.entity;

import com.ccc.roll_model.member.infrastructure.MemberEntity;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "likes")
@Getter
@NoArgsConstructor
public class LikeEntity {

    @Id
    @Column(name = "like_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int likeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private MemberEntity memberEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private PipelineEntity pipelineEntity;

    @Builder
    public LikeEntity(MemberEntity memberEntity, PipelineEntity pipelineEntity) {
        this.memberEntity = memberEntity;
        this.pipelineEntity = pipelineEntity;
    }
}
