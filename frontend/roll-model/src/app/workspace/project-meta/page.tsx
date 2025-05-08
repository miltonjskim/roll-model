'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { projectCategoryAtom, projectDescriptionAtom, projectDomainAtom, projectIdAtom, projectPublicAtom, projectTitleAtom } from '@/entities/workspace/model/projectAtoms';
import { projectCategory, projectDomain } from '@/entities/workspace/model/types';
import { CATEGORY_OPTIONS, DOMAIN_OPTIONS } from '@/features/workspace/constants/selectOptions';
import { createProject } from '@/features/workspace/service/createProject';
import { useAtom, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const InputProjectMetaDataPage = () => {
  const router = useRouter();

  const [title, setTitle] = useAtom(projectTitleAtom);
  const [description, setDescription] = useAtom(projectDescriptionAtom);
  const [domain, setDomain] = useAtom(projectDomainAtom);
  const [type, setType] = useAtom(projectCategoryAtom);
  const [isPublic, setIsPublic] = useAtom(projectPublicAtom);
  const setProjectId = useSetAtom(projectIdAtom);

  const handleSubmit = async () => {
    try {
      const res = await createProject({ title, description, domain, type, isPublic });
      console.log('프로젝트 생성 성공:', res);

      const projectId = res.id;
      setProjectId(projectId.toString());

      router.push('/workspace/data-selection');
    } catch (err) {
      console.error('프로젝트 생성 실패:', err);
    }
  };

  return (
    <div>
      <div>
        <h1>프로젝트 메타데이터 입력</h1>
        <h2>프로젝트 정보를 입력해 주세요.</h2>
      </div>
      <div>
        <div>
          <label htmlFor="project-name">프로젝트 이름</label>
          <Input type="text" value={title} id="project-name" placeholder="프로젝트 이름은 필수 입력 값입니다." onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label htmlFor="project-description">프로젝트 설명</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label htmlFor="project-domain">도메인 선택</label>
          <Select value={domain} onValueChange={(val) => setDomain(val as projectDomain)}>
            <SelectTrigger>
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {DOMAIN_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="project-category">모델 종류 선택</label>
          <Select value={type} onValueChange={(val) => setType(val as projectCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="project-public">프로젝트 공개 여부</label>
          <RadioGroup value={isPublic ? 'true' : 'false'} onValueChange={(value) => setIsPublic(value === 'true')} className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="public" />
              <label htmlFor="public">공개</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="private" />
              <label htmlFor="private">비공개</label>
            </div>
          </RadioGroup>
        </div>

        <Button variant="black" onClick={handleSubmit}>
          다음 단계로
        </Button>
      </div>
    </div>
  );
};

export default InputProjectMetaDataPage;
