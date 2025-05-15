'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { completedDatasetAtom, dataColumnsAtom, pipelineIdAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { projectCategoryAtom, projectDescriptionAtom, projectDomainAtom, projectPublicAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DOMAIN_OPTIONS } from '@/features/workspace/constants/selectOptions';

const categoryMap: Record<string, { label: string; description: string }> = {
  REGRESSION: {
    label: '회귀 (Regression)',
    description: '숫자 예측 문제 (예: 가격, 점수, 수치 예측)',
  },
  CLASSIFICATION: {
    label: '분류 (Classification)',
    description: '범주 예측 문제 (예: 스팸 여부, 질병 유무)',
  },
};

const columnTypeMap: Record<string, string> = {
  integer: '정수',
  float: '소수',
  string: '문자열',
  boolean: '참/거짓',
  datetime: '날짜/시간',
};

const CompletePreprocessDataPage = () => {
  const completedUploadset = useAtomValue(completedDatasetAtom);
  const router = useRouter();
  const setPipelineId = useSetAtom(pipelineIdAtom);
  const setProjectCategory = useSetAtom(projectCategoryAtom);
  const setDataColumns = useSetAtom(dataColumnsAtom);
  const projectTitle = useAtomValue(projectTitleAtom);
  const projectDomain = useAtomValue(projectDomainAtom);
  const projectDescription = useAtomValue(projectDescriptionAtom);
  const projectPublic = useAtomValue(projectPublicAtom);

  useEffect(() => {
    if (!completedUploadset) {
      showErrorToast('전처리 완료 정보가 없습니다.');
      router.push('/workspace');
    }
  }, [completedUploadset, router]);

  const handleMoveModelingPage = () => {
    if (!completedUploadset) {
      showErrorToast('전처리 완료 정보가 없습니다.');
      return;
    }

    const { pipelineId, columns, category } = completedUploadset;

    if (!pipelineId || !columns || !category) {
      showErrorToast('필수 정보가 누락되었습니다.');
      return;
    }

    setPipelineId(pipelineId);
    setDataColumns(columns);
    setProjectCategory(category);
    router.push('/workspace/modeling-section');
  };

  const getDomainLabel = (value: string) => {
    return DOMAIN_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
  };

  if (!completedUploadset) return null;

  const { pipelineId, columns, category } = completedUploadset;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
      <div className="text-center">
        <h1 className="text-lg font-bold">데이터 전처리 완료</h1>
        <p className="text-[var(--color-gray-01)]">모델 학습을 시작해보세요.</p>
      </div>

      <div className="space-y-4 rounded-md bg-white p-5 text-sm text-gray-800 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="font-semibold text-gray-900">
              <span className="font-tossface mr-1">📁</span>프로젝트 제목
            </p>
            <p className="mt-0.5">{projectTitle}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              <span className="font-tossface mr-1">🌐</span>도메인
            </p>
            <span className="bg-[theme(color-gray-04)] mt-0.5 inline-block rounded px-2 py-1 text-sm font-medium text-gray-800">{getDomainLabel(projectDomain)}</span>
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              <span className="font-tossface mr-1">🧠</span>프로젝트 타입
            </p>
            <span className="bg-[theme(color-gray-04)] mt-0.5 inline-block rounded px-2 py-1 text-sm font-medium text-gray-800">{categoryMap[category]?.label ?? category}</span>
            {categoryMap[category]?.description && <p className="mt-1 text-xs text-gray-500">{categoryMap[category].description}</p>}
          </div>

          {projectDescription && (
            <div>
              <p className="font-semibold text-gray-900">
                <span className="font-tossface mr-1">🎯</span>목표 변수
              </p>
              <p className="mt-0.5 text-gray-700">{projectDescription}</p>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-[theme(color-gray-04)]">
            <TableRow>
              <TableHead className="px-4 py-2 text-center">컬럼명</TableHead>
              <TableHead className="px-4 py-2 text-center">타입</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.map((col) => (
              <TableRow key={col.name} className="border-t">
                <TableCell className="px-4 py-2 font-medium text-gray-900">{col.name}</TableCell>
                <TableCell className="px-4 py-2 text-gray-600">{columnTypeMap[col.type] ? `${columnTypeMap[col.type]} (${col.type})` : col.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-center">
        <Button onClick={handleMoveModelingPage} variant="black" size="lg" className="w-full max-w-xs">
          모델 학습 시작하기
        </Button>
      </div>
    </div>
  );
};

export default CompletePreprocessDataPage;
