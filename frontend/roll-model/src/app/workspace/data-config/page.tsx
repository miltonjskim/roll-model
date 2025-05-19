'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { projectCategoryAtom, projectDescriptionAtom, projectDomainAtom, projectIdAtom, projectPublicAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { aiRecommendedStepsAtom, uploadedDatasetAtom, uploadedFileAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUploadDataset } from '@/app/workspace/data-config/hooks/useUploadData';
import { UploadDatasetRequest } from '@/entities/workspace/data-config/model/types';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { DataPreviewTable } from '@/features/workspace/data-upload/ui/components/DataPreviewTable';
import { DelimiterSelector } from '@/features/workspace/data-upload/ui/components/DelimiterSelector';
import { EncodingSelector } from '@/features/workspace/data-upload/ui/components/EncodingSelector';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { ApiError } from '@/shared/model/types/apiResponse';
import { createProject } from '@/features/workspace/service/createProject';
import BackButton from '@/shared/ui/BackButton';
import { globalLoadingAtom, globalLoadingMessageAtom } from '@/shared/model/atoms/GlobalLoadingAtom';
import { registerConfigDataGuideSteps } from '@/features/guide/steps/registerConfigDataGuideSteps';
import { startGuide } from '@/features/guide/useGuide';
import { guide } from '@/features/guide/GuideProvider';
import DataTypeInfoDialog from '@/features/workspace/data-upload/ui/DataTypeInfoDialog';
import StepProgress from '@/features/workspace/ui/StepProgress';
import { requestPreprocessingStepsFromAI } from '@/features/workspace/data-upload/service/requestPreprocessingStepsFromAI';
import { inferType } from '@/entities/workspace/data-config/utils/inferType';
import { generateColumnPayload } from '@/entities/workspace/data-config/utils/generateColumnPayload';
import { getDelimiterType } from '@/entities/workspace/data-config/utils/getDelimiterType';

const ConfigDataPage = () => {
  const router = useRouter();
  const mutation = useUploadDataset();
  const file = useAtomValue(uploadedFileAtom);
  const [projectTitle] = useAtom(projectTitleAtom);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [delimiter, setDelimiter] = useState(','); // 구분자 선택
  const [encoding, setEncoding] = useState('UTF-8'); // 인코딩
  const [header, setHeader] = useState<string[]>([]); // 컬럼
  const [previewRow, setPreviewRow] = useState<string[]>([]); // 상위 데이터 1행
  const [columnTypes, setColumnTypes] = useState<string[]>([]); // 컬럼 타입
  const [useHeaderRow, setUseHeaderRow] = useState(true); // 첫 줄을 헤더로 사용할지 말지
  const [editableHeaderIndex, setEditableHeaderIndex] = useState<number | null>(null);
  const [selectedDelimiterOption, setSelectedDelimiterOption] = useState(','); // UI에서 선택된 라디오 옵션
  const [customDelimiter, setCustomDelimiter] = useState(''); // 사용자가 입력한 값
  const setUploadedDataset = useSetAtom(uploadedDatasetAtom);
  const setAiRecommendedStepsAtom = useSetAtom(aiRecommendedStepsAtom);
  const projectDescription = useAtomValue(projectDescriptionAtom);
  const projectdomain = useAtomValue(projectDomainAtom);
  const projectCategory = useAtomValue(projectCategoryAtom);
  const projectPublic = useAtomValue(projectPublicAtom);
  const setProjectId = useSetAtom(projectIdAtom);
  const setGlobalLoading = useSetAtom(globalLoadingAtom);
  const setLoadingMessage = useSetAtom(globalLoadingMessageAtom);

  // 헤더 편집 마무리 시 상태 저장 (최종)
  const handleHeaderEditComplete = (idx: number, newValue: string) => {
    const updated = [...header];
    updated[idx] = newValue.trim();
    setHeader(updated);
    setEditableHeaderIndex(null);
  };

  // 헤더 변경하는 함수 (실시간 상태 반영)
  const handleHeaderChange = (idx: number, value: string) => {
    const updated = [...header];
    updated[idx] = value;
    setHeader(updated);
  };

  // 헤더 타입 변경 함수
  const handleTypeChange = (idx: number, value: string) => {
    const updated = [...columnTypes];
    updated[idx] = value;
    setColumnTypes(updated);
  };

  // 프로젝트 생성 요청 함수
  const handleCreateProject = async () => {
    setGlobalLoading(true);
    setLoadingMessage('프로젝트를 생성하고 있습니다...');

    const payload = {
      title: projectTitle,
      description: projectDescription,
      domain: projectdomain,
      type: projectCategory,
      isPublic: projectPublic,
    };

    try {
      const response = await createProject(payload);
      const projectId = response.data.id.toString();
      setProjectId(projectId);
      setLoadingMessage('데이터셋을 업로드하고 분석하고 있어요.');

      const [uploadSuccess, aiResponse] = await Promise.all([handleUpload(projectId), fetchRecommendedPreprocessingSteps(projectId)]);

      if (uploadSuccess && aiResponse) {
        router.push('/workspace/data-preprocess');
      }
    } catch (err) {
      showErrorToast('프로젝트 생성에 실패했습니다.');
      console.error('프로젝트 생성 실패:', err);
    } finally {
      setGlobalLoading(false);
      setLoadingMessage(null);
    }
  };

  // 원본 데이터셋 업로드 함수
  const handleUpload = async (projectId: string): Promise<boolean> => {
    if (!file) return false;

    const { delimiter, customDelimiter: resolvedCustomDelimiter } = getDelimiterType(selectedDelimiterOption, customDelimiter);
    const columns = generateColumnPayload(header, columnTypes);

    const payload = {
      delimiter: delimiter,
      customDelimiter: resolvedCustomDelimiter,
      encoding: encoding as UploadDatasetRequest['encoding'],
      hasHeader: useHeaderRow,
      columns: columns,
    };

    try {
      const response = await mutation.mutateAsync({ projectId, config: payload, file });
      const data = response.data;
      setUploadedDataset(data.result);
      setAiRecommendedStepsAtom(data.step);
      return true;
    } catch (err) {
      showErrorToast((err as Error).message);
      console.error(err);
      return false;
    }
  };

  // AI 추천 단계 요청
  const fetchRecommendedPreprocessingSteps = async (projectId: string) => {
    // console.log('file:', file);

    if (!file) return false;

    setGlobalLoading(true);
    setLoadingMessage('AI에게 전처리 단계를 추천받고 있어요.');
    try {
      const response = await requestPreprocessingStepsFromAI(file, projectId);
      console.log('ai response.data:', response.data);
      console.log('ai response,data,step:', response.data.step);

      setAiRecommendedStepsAtom(response.data.step);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      showErrorToast(apiError.message);
      console.error(apiError);
      return false;
    } finally {
      setGlobalLoading(false);
      setLoadingMessage(null);
    }
  };

  // csv 데이터 파싱
  const parseFile = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = text
        .split('\n')
        .map((row) => row.trim())
        .filter((row) => row !== '')
        .map((row) => row.split(delimiter));

      if (rows.length > 0) {
        const preview = useHeaderRow ? (rows[1] ?? []) : rows[0];
        setHeader(
          useHeaderRow
            ? rows[0]
            : Array(preview.length)
                .fill('')
                .map((_, idx) => `컬럼 ${idx + 1}`),
        ); // 헤더 입력하지 않으면 기본값 컬럼 1, 컬럼 2, ... 이런식으로
        setPreviewRow(preview);
        setColumnTypes(preview.map(inferType));
      }
      setCsvData(rows);
    };
    reader.readAsText(file, encoding);
  };

  useEffect(() => {
    parseFile();
    // 아래 주석 지우면 eslint 경고 뜸 삭제 금지!!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, delimiter, encoding, useHeaderRow]);

  useEffect(() => {
    if (selectedDelimiterOption === '기타 입력') {
      setDelimiter(customDelimiter);
    } else {
      setDelimiter(selectedDelimiterOption);
    }
  }, [selectedDelimiterOption, customDelimiter]);

  useEffect(() => {
    const dismissed = localStorage.getItem('guide.dismissed') === 'true';

    if (!dismissed) {
      guide.cancel();
      guide.steps = [];
      registerConfigDataGuideSteps();
      startGuide();
    }
  }, []);

  return (
    <div className="flex flex-col justify-center">
      <div className="flex items-center justify-between px-28">
        <div className="text-left">
          <h1 className="text-lg font-bold">4. 데이터 설정하기</h1>
          <h2 className="text-base">업로드된 데이터를 확인하고 필요한 설정을 진행해 주세요.</h2>
        </div>
        <StepProgress />
      </div>

      <div className="mx-auto mt-8 mb-4 flex max-w-[90%] items-stretch justify-center gap-4">
        <div className="flex max-w-[90%] basis-[60rem] flex-col gap-4">
          <div className="bg-[theme(primary-white)] flex-1 rounded-md">
            <div className="p-6 text-left">
              <div className="mb-3">
                <h3 className="font-semibold">데이터 구조 확인</h3>
                <p className="text-sm font-medium text-[color:var(--color-gray-01)]">데이터의 상위 1행을 미리 확인할 수 있습니다.</p>
              </div>

              <div className="mb-2">
                <h4 className="text-xs font-semibold text-[color:var(--color-gray-01)]">프로젝트 정보</h4>
                <p className="text-sm font-semibold">{projectTitle}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[color:var(--color-gray-01)]">불러온 데이터</h4>
                <p className="text-sm font-semibold">{file?.name}</p>
              </div>
              <div className="mt-2 mr-4 flex items-center justify-end space-x-2">
                <Checkbox id="use-header-row" checked={useHeaderRow} onCheckedChange={(checked) => setUseHeaderRow(Boolean(checked))} />
                <label htmlFor="use-header-row" className="guide-header-toggle text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  첫 줄을 헤더로 사용
                </label>
              </div>
              <div className="guide-header-edit overflow-x-auto p-4">
                <DataPreviewTable
                  header={header}
                  previewRow={previewRow}
                  columnTypes={columnTypes}
                  editableHeaderIndex={editableHeaderIndex}
                  useHeaderRow={useHeaderRow}
                  onHeaderEdit={handleHeaderChange}
                  onHeaderEditComplete={handleHeaderEditComplete}
                  onTypeChange={handleTypeChange}
                  setEditableHeaderIndex={setEditableHeaderIndex}
                />
              </div>
            </div>
          </div>

          {header.length > 0 && (
            <div className="bg-[theme(primary-white)] flex-1 rounded-md p-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    <span className="text-[color:var(--color-error-text)]">*</span>컬럼별 타입 지정
                  </h3>
                  <p className="text-sm font-medium text-[color:var(--color-gray-01)]">각 컬럼의 데이터 타입을 지정해 주세요.</p>
                </div>
                <DataTypeInfoDialog />
              </div>

              <div className="guide-column-type flex flex-wrap gap-x-12 p-4">
                {header.map((col, idx) => (
                  <div key={idx} className="my-2 flex items-center gap-6 text-sm">
                    <span className="w-32 font-semibold">{col.length === 0 ? `컬럼 ${idx + 1}` : col}</span>
                    <Select
                      value={columnTypes[idx]}
                      onValueChange={(value) => {
                        const newTypes = [...columnTypes];
                        newTypes[idx] = value;
                        setColumnTypes(newTypes);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="타입 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">string</SelectItem>
                        <SelectItem value="integer">integer</SelectItem>
                        <SelectItem value="double">double</SelectItem>
                        <SelectItem value="boolean">boolean</SelectItem>
                        <SelectItem value="datetime">datetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex basis-[24rem] flex-col justify-between">
          <div className="bg-[theme(primary-white)] flex-1 rounded-md p-6 text-left">
            <div className="guide-delimiter-select">
              <h3 className="font-semibold">
                <span className="text-[color:var(--color-error-text)]">*</span>구분자 선택
              </h3>
              <p className="text-sm font-medium text-[color:var(--color-gray-01)]">
                데이터 열을 구분하는 구분자를 선택해야 합니다.
                <br />
                열이 정상적으로 구분되지 않은 경우,
                <br />
                올바른 구분자를 선택해 주세요.
              </p>
              <div>
                <DelimiterSelector selected={selectedDelimiterOption} customValue={customDelimiter} onDelimiterChange={setSelectedDelimiterOption} onCustomChange={setCustomDelimiter} />
              </div>
            </div>

            <div className="mt-6">
              <div className="guide-delimiter-select">
                <h3 className="font-semibold">
                  <span className="text-[color:var(--color-error-text)]">*</span>인코딩 선택
                </h3>
                <p className="text-sm font-medium text-[color:var(--color-gray-01)]">
                  글자가 깨져 보인다면 인코딩을 변경하여 확인할 수 있습니다.
                  <br />
                  텍스트가 정상적으로 표시되지 않을 경우,
                  <br />
                  다른 인코딩을 선택해 보세요.
                </p>
              </div>
              <div className="guide-encoding-select">
                <EncodingSelector value={encoding} onChange={setEncoding} />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <BackButton size="lg" className="hover:bg-[theme(color-gray-05)] mb-2 h-12 w-full">
              ← 이전 단계로
            </BackButton>
            <Button variant="black" size="lg" className="h-12 w-full" onClick={handleCreateProject}>
              전처리 단계로 넘어가기 →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigDataPage;
