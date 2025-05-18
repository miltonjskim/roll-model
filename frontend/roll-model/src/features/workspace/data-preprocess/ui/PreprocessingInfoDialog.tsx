'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const PreprocessingInfoDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          📘 전처리 기능 전체 설명 보기
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>전처리 기능 안내</DialogTitle>
        </DialogHeader>

        <Accordion type="multiple" className="mt-4 space-y-2">
          {/* 1. 결측치 처리 */}
          <AccordionItem value="missing-values" className="overflow-hidden rounded-md border border-gray-200">
            <AccordionTrigger className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-100 data-[state=open]:bg-blue-50">
              <div className="flex items-center">
                <span className="font-tossface mr-2 text-lg">❓</span>
                <span>결측치 처리</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 bg-white px-5 py-4 text-sm leading-relaxed">
              <p>
                데이터에 빈칸이 있는 경우, 이를 어떻게 처리할지 선택해요.
                <br />
                빈칸이 많으면 모델이 헷갈릴 수 있어요.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>평균값으로 대체</b>: 평균(모든 값을 더해서 나눈 값)으로 빈칸을 채워요.
                </li>
                <li>
                  <b>중앙값으로 대체</b>: 중간 위치의 값으로 채워요. 극단적인 값에 덜 영향을 받아요.
                </li>
                <li>
                  <b>최빈값으로 대체</b>: 가장 많이 등장한 값으로 채워요. 범주형 데이터에 좋아요.
                </li>
                <li>
                  <b>결측치가 있는 행 제거</b>: 빈칸이 있는 행 전체를 삭제해요.
                </li>
                <li>
                  <b>결측치가 있는 열 제거</b>: 빈칸이 있는 컬럼을 삭제해요.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 2. 이상치 탐지 */}
          <AccordionItem value="outlier-detection" className="overflow-hidden rounded-md border border-gray-200">
            <AccordionTrigger className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-100 data-[state=open]:bg-blue-50">
              <div className="flex items-center">
                <span className="font-tossface mr-2 text-lg">🔍</span>
                <span>이상치 탐지</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 bg-white px-5 py-4 text-sm leading-relaxed">
              <p>
                너무 크거나 작은 ‘튀는 값’은 분석을 방해할 수 있어요.
                <br />
                이런 이상값을 찾아낼 수 있어요.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>Z-점수 기반 탐지</b>: 평균에서 얼마나 떨어져 있는지를 기준으로 판단해요. (표준편차: 평균에서 얼마나 멀리 떨어져 있는지)
                </li>
                <li>
                  <b>IQR 기반 탐지</b>: 중간값을 기준으로 정해진 범위를 벗어난 값들을 찾아요.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 3. 이상치 처리 */}
          <AccordionItem value="outlier-handle" className="overflow-hidden rounded-md border border-gray-200">
            <AccordionTrigger className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-100 data-[state=open]:bg-blue-50">
              <div className="flex items-center">
                <span className="font-tossface mr-2 text-lg">🛠️</span>
                <span>이상치 처리</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 bg-white px-5 py-4 text-sm leading-relaxed">
              <p>이상치를 그대로 두지 않고 제거하거나 다른 값으로 바꿔줄 수 있어요.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>평균/중앙값/최빈값으로 대체</b>: 이상값을 적절한 값으로 바꿔요.
                </li>
                <li>
                  <b>행 제거</b>: 이상값이 있는 행을 삭제해요.
                </li>
                <li>
                  <b>열 제거</b>: 이상값이 많은 컬럼을 삭제해요.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 4. 데이터 변환 */}
          <AccordionItem value="data-transformation" className="overflow-hidden rounded-md border border-gray-200">
            <AccordionTrigger className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-100 data-[state=open]:bg-blue-50">
              <div className="flex items-center">
                <span className="font-tossface mr-2 text-lg">🔁</span>
                <span>데이터 변환</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 bg-white px-5 py-4 text-sm leading-relaxed">
              <p>데이터의 크기나 분포를 조정해서 모델이 이해하기 쉬운 형태로 만들어요.</p>
              <p>특히, 데이터 타입이 string인 경우엔 정규화가 꼭 필요합니다.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>Z-점수 정규화</b>: 평균 0, 표준편차 1로 맞춰요.
                </li>
                <li>
                  <b>Min-Max 정규화</b>: 0과 1 사이 값으로 맞춰요.
                </li>
                <li>
                  <b>로그/제곱근 변환</b>: 값이 너무 크거나 쏠릴 때 분포를 부드럽게 조정해요.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 5. 인코딩 */}
          <AccordionItem value="encoding" className="overflow-hidden rounded-md border border-gray-200">
            <AccordionTrigger className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-100 data-[state=open]:bg-blue-50">
              <div className="flex items-center">
                <span className="font-tossface mr-2 text-lg">🧮</span>
                <span>인코딩</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 bg-white px-5 py-4 text-sm leading-relaxed">
              <p>문자(텍스트) 데이터를 숫자로 바꿔서 모델이 처리할 수 있도록 해요.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>원핫 인코딩</b>: 하나의 값을 여러 개의 0과 1로 표현해요.
                </li>
                <li>
                  <b>레이블 인코딩</b>: 범주형 값을 순서대로 숫자로 바꿔요.
                </li>
                <li>
                  <b>타겟 인코딩</b>: 평균값을 이용해 숫자로 바꿔요. 성능이 좋지만 주의가 필요해요.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 6. 클래스 불균형 처리 */}
          <AccordionItem value="class-balancing" className="overflow-hidden rounded-md border border-gray-200">
            <AccordionTrigger className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-100 data-[state=open]:bg-blue-50">
              <div className="flex items-center">
                <span className="font-tossface mr-2 text-lg">⚖️</span>
                <span>클래스 불균형 처리</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 bg-white px-5 py-4 text-sm leading-relaxed">
              <p>한 클래스가 너무 많거나 적은 경우, 데이터를 균형 있게 만들어줘요.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>오버샘플링</b>: 적은 클래스를 복제해서 수를 늘려요.
                </li>
                <li>
                  <b>언더샘플링</b>: 많은 클래스를 줄여서 균형을 맞춰요.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
};

export default PreprocessingInfoDialog;
