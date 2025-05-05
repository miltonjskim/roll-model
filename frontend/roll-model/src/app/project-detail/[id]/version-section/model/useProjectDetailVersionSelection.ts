import { useState, useEffect } from "react";
import {
  Pipelines,
  VersionHistory,
  ProjectInfo,
} from "@/entities/project-detail/model/versionTypes";

export function useProjectDetailVersionSelection(
  projectDetailData:
    | {
        projectInfo?: ProjectInfo;
        versionHistory?: VersionHistory[];
        pipelines?: Pipelines[];
      }
    | undefined
    | null
) {
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipelines | null>(
    null
  );
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [pipelines, setPipelines] = useState<Pipelines[]>([]);

  // 프로젝트 데이터가 변경되면 상태 업데이트
  useEffect(() => {
    if (projectDetailData) {
      setVersionHistory(projectDetailData.versionHistory || []);
      setPipelines(projectDetailData.pipelines || []);
    }
  }, [projectDetailData]);

  // 버전 데이터가 로드되면 최신 버전을 선택
  useEffect(() => {
    if (versionHistory.length > 0) {
      // 최신 버전을 찾음 (업데이트 날짜 기준)
      const latestVersion = versionHistory.reduce((latest, current) => {
        return new Date(current.updatedAt) > new Date(latest.updatedAt)
          ? current
          : latest;
      }, versionHistory[0]);

      setSelectedVersion(latestVersion.version);
    }
  }, [versionHistory]);

  // 선택된 버전에 해당하는 파이프라인 데이터 찾기
  useEffect(() => {
    if (selectedVersion && pipelines.length > 0) {
      const pipeline = pipelines.find((p) => p.version === selectedVersion);
      setSelectedPipeline(pipeline || null);
    }
  }, [selectedVersion, pipelines]);

  // 버전 선택 핸들러
  const handleSelectVersion = (version: number) => {
    setSelectedVersion(version);
  };

  // 최신 버전 찾기
  const getLatestVersion = (): number => {
    if (versionHistory.length === 0) return 0;

    return versionHistory.reduce((latest, current) => {
      return current.version > latest ? current.version : latest;
    }, versionHistory[0].version);
  };

  // 공개 버전 필터링
  const getPublicVersions = (): VersionHistory[] => {
    return versionHistory.filter((v) => v.publicYn);
  };

  // 삭제된 버전 필터링
  const getDeletedVersions = (): VersionHistory[] => {
    return versionHistory.filter((v) => v.deletedYn);
  };

  return {
    selectedVersion,
    selectedPipeline,
    versionHistory,
    pipelines,
    handleSelectVersion,
    getLatestVersion,
    getPublicVersions,
    getDeletedVersions,
  };
}
