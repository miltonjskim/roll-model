'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DataTypeInfoDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="black" size="sm" className="flex items-center gap-1">
          데이터 타입이란?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">데이터 타입이란?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-gray-700">
          <p>
            데이터를 다룰 때 <b>‘이 값이 어떤 종류인지’</b>를 구분하는 기준이에요.
            <br />
            AI 모델링이나 전처리를 정확하게 하기 위해 <b>정확한 데이터 타입 지정</b>이 중요합니다.
          </p>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">자주 쓰이는 데이터 타입</p>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="text-[theme(color-primary)] font-semibold">🔤 String (문자열)</p>
                <p className="ml-4 text-gray-600">
                  텍스트 데이터입니다. 예: <code className="bg-gray-100 px-1">&quot;apple&ldquo;</code>, <code className="bg-gray-100 px-1">&quot;서울&ldquo;</code>
                </p>
              </div>
              <div>
                <p className="text-[theme(color-primary)] font-semibold">🔢 Integer (정수)</p>
                <p className="ml-4 text-gray-600">
                  소수점 없는 숫자입니다. 예: <code className="bg-gray-100 px-1">1</code>, <code className="bg-gray-100 px-1">25</code>, <code className="bg-gray-100 px-1">-3</code>
                </p>
              </div>
              <div>
                <p className="text-[theme(color-primary)] font-semibold">📐 Double (실수)</p>
                <p className="ml-4 text-gray-600">
                  소수점이 있는 숫자입니다. 예: <code className="bg-gray-100 px-1">3.14</code>, <code className="bg-gray-100 px-1">-0.01</code>
                </p>
              </div>
              <div>
                <p className="text-[theme(color-primary)] font-semibold">✅ Boolean (참/거짓)</p>
                <p className="ml-4 text-gray-600">
                  논리값입니다. 예: <code className="bg-gray-100 px-1">true</code>, <code className="bg-gray-100 px-1">false</code>, <code className="bg-gray-100 px-1">1</code>,{' '}
                  <code className="bg-gray-100 px-1">0</code>
                </p>
              </div>
              <div>
                <p className="text-[theme(color-primary)] font-semibold">📅 Datetime (날짜/시간)</p>
                <p className="ml-4 text-gray-600">
                  날짜 또는 시간입니다. 예: <code className="bg-gray-100 px-1">2024-04-27</code>, <code className="bg-gray-100 px-1">14:30:00</code>
                </p>
              </div>
              <div>
                <p className="text-[theme(color-primary)] font-semibold">🏷️ Category (범주형)</p>
                <p className="ml-4 text-gray-600">
                  그룹 분류용 데이터입니다. 예: <code className="bg-gray-100 px-1">&quot;A&ldquo;</code>, <code className="bg-gray-100 px-1">&quot;제품군&ldquo;</code>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">💡 데이터 타입을 올바르게 지정하면 모델의 정확도가 높아지고, 분석 결과도 더 신뢰할 수 있어요!</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataTypeInfoDialog;
