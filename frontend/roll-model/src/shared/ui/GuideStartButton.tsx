'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { registerPreprocessingSteps } from '@/features/guide/steps/preprocessingSteps';
import { startGuide } from '@/features/guide/useGuide';

export default function GuideStartButton() {
  useEffect(() => {
    registerPreprocessingSteps(); // 페이지 로드시 가이드 등록
  }, []);

  return (
    <Button variant="outline" onClick={startGuide}>
      🧭 가이드 보기
    </Button>
  );
}
