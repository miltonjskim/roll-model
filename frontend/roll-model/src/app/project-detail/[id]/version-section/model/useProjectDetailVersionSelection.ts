import { useState, useEffect } from 'react';
import { Pipeline, ProjectInfo } from '@/entities/project-detail/model/versionTypes';

export function useProjectDetailVersionSelection(
  projectDetailData:
    | {
        projectInfo?: ProjectInfo;
        pipelines?: Pipeline[];
      }
    | undefined
    | null,
) {
  const [selectedVersion, setSelectedVersion] = useState<string>('0');
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);

  // 프로젝트 데이터가 변경되면 상태 업데이트
  useEffect(() => {
    if (projectDetailData) {
      setPipelines(projectDetailData.pipelines || []);
    }
  }, [projectDetailData]);

  // 버전 데이터가 로드되면 최신 버전을 선택
  useEffect(() => {
    if (pipelines.length > 0) {
      // 최신 버전을 찾음 (업데이트 날짜 기준)
      const latestPipeline = pipelines.reduce((latest, current) => {
        return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
      }, pipelines[0]);

      setSelectedVersion(latestPipeline.version);
    }
  }, [pipelines]);

  // 선택된 버전에 해당하는 파이프라인 데이터 찾기
  useEffect(() => {
    if (selectedVersion && pipelines.length > 0) {
      const pipeline = pipelines.find((p) => p.version === selectedVersion);
      setSelectedPipeline(pipeline || null);
    }
  }, [selectedVersion, pipelines]);

  // 버전 선택 핸들러
  const handleSelectVersion = (version: string) => {
    setSelectedVersion(version);
  };

  // 최신 버전 찾기
  const getLatestVersion = (): string => {
    if (pipelines.length === 0) return '0';

    return pipelines.reduce((latest, current) => {
      return parseFloat(current.version) > parseFloat(latest) ? current.version : latest;
    }, pipelines[0].version);
  };

  // 공개 버전 필터링
  const getPublicVersions = (): Pipeline[] => {
    return pipelines.filter((v) => v.publicYn);
  };

  // 삭제된 버전 필터링
  const getDeletedVersions = (): Pipeline[] => {
    return pipelines.filter((v) => v.deletedYn);
  };

  // 소유한 버전 필터링 (추가: 새로운 기능)
  const getOwnedVersions = (): Pipeline[] => {
    return pipelines.filter((p) => p.ownerYn);
  };

  return {
    selectedVersion,
    selectedPipeline,
    pipelines,
    handleSelectVersion,
    getLatestVersion,
    getPublicVersions,
    getDeletedVersions,
    getOwnedVersions,
  };
}
