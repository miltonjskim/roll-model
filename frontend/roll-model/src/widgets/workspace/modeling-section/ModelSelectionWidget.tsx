'use client';

const ModelSelectionWidget = () => {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">분류 모델 선택하기</h2>

      {/* 모델 목록 */}
      <div className="space-y-4">
        {['로지스틱 회귀', '서포트 벡터 머신', 'K-최근접 이웃', '랜덤 포레스트', '그래디언트 부스팅'].map((model) => (
          <div key={model} className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 transition-colors hover:border-[var(--color-blue-01)]">
            <h3 className="font-bold">{model}</h3>
            <p className="text-sm text-[var(--color-gray-01)]">
              contextcontextcontextcontextcontextcontextcontextcontext contextcontextcontextcontextcontextcontextcontextcontext contextcontextcontextcontextcontextcontextcontextcontext
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelectionWidget;
