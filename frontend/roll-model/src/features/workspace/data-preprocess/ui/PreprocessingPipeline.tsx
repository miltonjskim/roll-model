import { Button } from '@/components/ui/button';

const PreprocessingPipeline = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <div className="mt-4 flex items-start gap-2">
      <div className="min-h-[8rem] flex-1 rounded-md border border-gray-300 p-4">
        <div className="inline-block rounded-md border border-gray-200 px-4 py-2">
          <p className="text-sm font-semibold">결측치 제거</p>
          <p className="text-xs text-gray-600">평균값으로 대체</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="black" size="sm" className="w-[5rem]" onClick={onAdd}>
          + 추가
        </Button>
        <Button variant="outline" size="sm" className="w-[5rem]">
          - 삭제
        </Button>
      </div>
    </div>
  );
};

export default PreprocessingPipeline;
