'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { projectIdAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { uploadedDatasetAtom, uploadedFileAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUploadDataset } from '@/app/workspace/data-config/hooks/useUploadData';
import { UploadDatasetRequest } from '@/entities/workspace/data-config/model/types';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { DataPreviewTable } from '@/features/workspace/data-upload/ui/components/DataPreviewTable';
import { DelimiterSelector } from '@/features/workspace/data-upload/ui/components/DelimiterSelector';
import { EncodingSelector } from '@/features/workspace/data-upload/ui/components/EncodingSelector';

const ConfigDataPage = () => {
  const router = useRouter();
  const projectId = useAtomValue(projectIdAtom);
  const mutation = useUploadDataset(projectId);
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

  const handleUpload = () => {
    if (!file) return;

    const delimiterMap: Record<string, UploadDatasetRequest['delimiter']> = {
      ',': 'comma',
      ';': 'semicolon',
      '\t': 'tab',
      '기타 입력': 'other',
    };

    const delimiter = delimiterMap[selectedDelimiterOption] ?? 'other';

    const payload = {
      delimiter: delimiter,
      customDelimiter: selectedDelimiterOption === '기타 입력' ? customDelimiter : undefined,
      encoding: encoding as UploadDatasetRequest['encoding'], // 캐스팅
      hasHeader: useHeaderRow,
      columns: header.map((col, idx) => ({
        name: col.length > 0 ? col : `컬럼 ${idx + 1}`,
        type: columnTypes[idx] as UploadDatasetRequest['columns'][number]['type'], // 캐스팅
      })),
    };

    mutation.mutate(
      { config: payload, file },
      {
        onSuccess: (response) => {
          console.log('onSuccessData:', response.data);

          setUploadedDataset(response.data);
          router.push('/workspace/data-preprocess');
        },
        onError: (err) => {
          showErrorToast(err.message);
          console.error(err);
        },
      },
    );
  };

  // 컬럼 타입 확인하는 함수
  const inferType = (value: string): string => {
    const trimmed = value.trim();
    const lower = trimmed.toLowerCase();

    if (lower === 'true' || lower === 'false') {
      return 'boolean';
    }

    const num = Number(trimmed);
    if (!isNaN(num)) {
      if (Number.isInteger(num)) {
        return 'integer';
      } else {
        return 'double';
      }
    }

    if (!isNaN(Date.parse(trimmed))) {
      return 'date';
    }

    return 'string';
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

  return (
    <div>
      <div>
        <h1 className="text-xl font-bold">데이터 설정하기</h1>
        <h2>업로드된 데이터를 확인하고 필요한 설정을 진행해 주세요.</h2>
      </div>

      <div className="mx-auto mt-4 flex gap-4">
        <div className="max-w-[60rem] basis-[60rem]">
          <div className="bg-[theme(primary-white)] rounded-md">
            <div className="p-6 text-left">
              <div className="mb-3">
                <h3 className="font-semibold">데이터 구조 확인</h3>
                <p className="text-sm text-[color:var(--color-gray-01)]">데이터의 상위 1행을 미리 확인할 수 있습니다.</p>
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
                <label htmlFor="use-header-row" className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  첫 줄을 헤더로 사용
                </label>
              </div>
              <div className="overflow-x-auto p-4">
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
            <div className="bg-[theme(primary-white)] mt-4 rounded-md p-6 text-left">
              <div>
                <h3 className="font-semibold">
                  <span className="text-[color:var(--color-error-text)]">*</span>컬럼별 타입 지정
                </h3>
                <p className="text-sm text-[color:var(--color-gray-01)]">각 컬럼의 데이터 타입을 지정해 주세요.</p>
              </div>

              <div className="gap- flex flex-wrap gap-x-12 p-4">
                {header.map((col, idx) => (
                  <div key={idx} className="my-2 flex items-center gap-2 text-sm">
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
                        <SelectItem value="date">date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex-1">
          <div className="bg-[theme(primary-white)] flex flex-col gap-4 rounded-md p-6 text-left">
            <div>
              <h3 className="font-semibold">
                <span className="text-[color:var(--color-error-text)]">*</span>구분자 선택
              </h3>
              <p className="text-sm text-[color:var(--color-gray-01)]">
                데이터 열을 구분하는 구분자를 선택해야 합니다.
                <br />
                열이 정상적으로 구분되지 않은 경우,
                <br />
                올바른 구분자를 선택해 주세요.
              </p>
              <div className="mt-2 space-y-2">
                <DelimiterSelector selected={selectedDelimiterOption} customValue={customDelimiter} onDelimiterChange={setSelectedDelimiterOption} onCustomChange={setCustomDelimiter} />
              </div>
            </div>

            <div>
              <div>
                <h3 className="font-semibold">
                  <span className="text-[color:var(--color-error-text)]">*</span>인코딩 선택
                </h3>
                <p className="text-sm text-[color:var(--color-gray-01)]">
                  글자가 깨져 보인다면 인코딩을 변경하여 확인할 수 있습니다.
                  <br />
                  텍스트가 정상적으로 표시되지 않을 경우,
                  <br />
                  다른 인코딩을 선택해 보세요.
                </p>
              </div>

              <EncodingSelector value={encoding} onChange={setEncoding} />
            </div>
          </div>

          <div className="pt-6">
            <Button variant="black" size="lg" className="h-12 w-full" onClick={handleUpload}>
              전처리 단계로 넘어가기 →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigDataPage;
