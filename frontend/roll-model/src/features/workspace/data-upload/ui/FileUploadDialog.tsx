'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { showErrorToast } from '@/shared/lib/toast/toast';
import { useSetAtom } from 'jotai';
import { uploadedFileAtom } from '@/entities/workspace/data-config/workspaceAtoms';

export const FileUploadDialog = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileEnter, setFileEnter] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isError, setIsError] = useState(false);
  const setUploadedFile = useSetAtom(uploadedFileAtom);

  const isAllowedFile = (file: File) => {
    const allowedExtensions = ['csv', 'parquet'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension && allowedExtensions.includes(extension);
  };

  const handleUploadFile = () => {
    router.push('/workspace/data-config');
  };

  const handleClickFileButton = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="black" className="text-md h-full flex-1/2">
          로컬 파일 사용하기
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[theme(primary-white)] w-150 sm:max-w-[50%]">
        <DialogHeader className="text-center">
          <DialogTitle>로컬 데이터 업로드</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="max-w-8xl container mx-auto px-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setFileEnter(true);
              }}
              onDragLeave={() => setFileEnter(false)}
              onDragEnd={(e) => {
                e.preventDefault();
                setFileEnter(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setFileEnter(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile && isAllowedFile(droppedFile)) {
                  setFile(droppedFile);
                  setUploadedFile(droppedFile);
                  setIsError(false);
                } else {
                  showErrorToast('csv 또는 parquet 파일만 업로드 가능합니다.');
                  setIsError(true);
                }
              }}
              className={`${fileEnter ? 'border-4' : 'border-2'} bg-[theme(color-gray-04)] mx-auto flex h-72 w-full max-w-lg flex-col items-center justify-center rounded-md border-dashed border-[color:var(--color-gray-02)]`}
            >
              <label htmlFor="file" className="flex h-full flex-col justify-center text-center text-sm">
                <span className="font-tossface text-7xl">{file ? '🗂️' : '📁'}</span>
                {file ? (
                  <>
                    <span className="mt-2 text-[color:var(--primary-black)]">{file.name}</span>
                    <Button onClick={handleUploadFile} variant="black" className="bg-[theme(primary-white)] mt-2 text-[color:var(--primary-black)]" size="sm">
                      데이터 확인 및 설정하기
                    </Button>
                  </>
                ) : (
                  <span className="text-[color:var(--color-gray-01)]">
                    파일을 드래그하거나,
                    <br />
                    아래의 찾아보기 버튼을 클릭해
                    <br />
                    데이터를 업로드 하세요.
                  </span>
                )}
              </label>
            </div>

            <div className="relative mx-auto mt-6 flex max-w-lg items-center justify-center gap-4">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".csv, .parquet"
                className="hidden"
                onChange={(e) => {
                  const uploaded = e.target.files?.[0];
                  if (uploaded && isAllowedFile(uploaded)) {
                    setFile(uploaded);
                    setUploadedFile(uploaded);
                    setIsError(false);
                  } else {
                    showErrorToast('csv 또는 parquet 파일만 업로드 가능합니다.');
                    setIsError(true);
                  }
                }}
              />
              <div
                className={`flex-3/4 truncate rounded-md border px-4 py-2 text-sm ${isError ? 'border-[color:var(--color-error)] text-[color:var(--color-error-text)]' : 'border-[color:var(--color-gray-03)] text-[color:var(--color-gray-01)]'}`}
              >
                {file ? file.name : '.csv, .parquet 형식의 파일 1개만 업로드 가능합니다.'}
              </div>
              <Button variant="black" onClick={handleClickFileButton} className="flex-1/4 rounded-md hover:text-[color:var(--primary-white)]">
                찾아보기
              </Button>
            </div>

            <p className="text-center text-sm text-[color:var(--color-gray-01)]">
              <span className="text-[color:var(--color-error-text)]">*</span>
              <span>{isError ? '지원하지 않는 파일 형식입니다.' : '.csv, .parquet 형식만 지원하며 500MB 이하의 파일 1개만 업로드 해주세요.'}</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
