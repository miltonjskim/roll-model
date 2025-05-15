package com.ccc.roll_model.project.infrastructure.entity.mysql;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "versions")
public class VersionEntity {
	@Id
	@Column(name = "version_id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer versionId;

	@Column(name = "group_id")
	private Integer groupId;

	@Column(name = "pipeline_id")
	private String pipelineId;

	@Column(name = "version_num")
	private String versionNum;

	@Column(name = "parent_version")
	private String parentVersion;

	VersionEntity(Integer versionId, Integer groupId, String pipelineId, String versionNum, String parentVersion) {
		this.versionId = versionId;
		this.groupId = groupId;
		this.pipelineId = pipelineId;
		this.versionNum = versionNum;
		this.parentVersion = parentVersion;
	}
}
