'use client';

const ParameterSectionWidget = () => {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">파라미터 설정하기</h2>

      {/* 목표변수 선택 */}
      <div className="mb-6">
        <h3 className="mb-2 text-lg">목표변수 선택</h3>
        <div className="grid grid-cols-2 gap-2">
          {['age', 'entropy', 'name', 'adress', 'type', 'usage', 'stack', 'score', 'col-9', 'col-10'].map((variable) => (
            <div key={variable} className="flex items-center space-x-2">
              <input type="radio" id={variable} name="targetVariable" className="h-4 w-4 accent-[var(--color-primary-foreground)]" />
              <label htmlFor={variable}>{variable}</label>
            </div>
          ))}
        </div>
      </div>

      {/* 파라미터 슬라이더 */}
      <div className="mb-4">
        <h3 className="mb-2">파라미터 1</h3>
        <input type="range" min="0" max="100" defaultValue="30" className="w-full accent-[var(--color-mint-01)]" />
        <div className="text-right text-sm">300</div>
      </div>

      <div className="mb-4">
        <h3 className="mb-2">파라미터 2</h3>
        <input type="range" min="0" max="100" defaultValue="50" className="w-full accent-[var(--color-green-01)]" />
        <div className="text-right text-sm">50%</div>
      </div>

      {/* 파라미터 라디오 */}
      <div className="mb-4">
        <h3 className="mb-2">파라미터 3</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input type="radio" id="gini" name="param3" className="h-4 w-4 accent-[var(--color-primary-foreground)]" />
            <label htmlFor="gini">gini</label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="radio" id="entropy" name="param3" className="h-4 w-4 accent-[var(--color-primary-foreground)]" defaultChecked />
            <label htmlFor="entropy">entropy</label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="radio" id="log_loss" name="param3" className="h-4 w-4 accent-[var(--color-primary-foreground)]" />
            <label htmlFor="log_loss">log_loss</label>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2">파라미터 4</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input type="radio" id="true" name="param4" className="h-4 w-4 accent-[var(--color-primary-foreground)]" />
            <label htmlFor="true">true</label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="radio" id="false" name="param4" className="h-4 w-4 accent-[var(--color-primary-foreground)]" />
            <label htmlFor="false">false</label>
          </div>
        </div>
      </div>

      {/* 데이터 분할 비율 */}
      <div>
        <h3 className="mb-2">데이터 분할 비율</h3>
        <div className="relative pt-1">
          <input type="range" min="0" max="100" defaultValue="70" className="w-full accent-[var(--color-blue-01)]" />
          <div className="flex justify-between">
            <span className="rounded-full bg-[var(--color-primary)] px-2 py-1 text-xs text-[var(--color-primary-foreground)]">70% 학습데이터</span>
            <span className="rounded-full bg-[var(--color-yellow-01)] px-2 py-1 text-xs text-[var(--primary-black)]">20% 검증데이터</span>
            <span className="rounded-full bg-[var(--color-blue-01)] px-2 py-1 text-xs text-[var(--color-primary-foreground)]">10% 테스트데이터</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterSectionWidget;
