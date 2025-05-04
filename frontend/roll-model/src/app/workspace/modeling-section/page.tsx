'use client';

import ModelSelectionWidget from "@/widgets/workspace/modeling-section/ModelSelectionWidget";
import ParameterSectionWidget from "@/widgets/workspace/modeling-section/ParameterSectionWidget";

export default function ModelingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-4">프로젝트 모델 선택</h1>
      <p className="text-center mb-8">모델을 선택해주세요.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 왼쪽: 파라미터 설정 */}
        <div className="bg-[var(--color-primary)] rounded-[var(--radius-lg)] p-6 text-[var(--color-primary-foreground)]">
          <ParameterSectionWidget />
        </div>
        
        {/* 오른쪽: 모델 선택 */}
        <div className="bg-[var(--color-card)] rounded-[var(--radius-lg)] p-6 border border-[var(--color-border)]">
          <ModelSelectionWidget />
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <button className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] py-3 px-8 rounded-full font-bold hover:opacity-90 transition">
          학습 시작하기
        </button>
      </div>
    </div>
  );
}