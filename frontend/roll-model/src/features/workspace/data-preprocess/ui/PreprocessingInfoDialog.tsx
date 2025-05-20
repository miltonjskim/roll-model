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
                  <ul>
                    <b>Z-점수 정규화</b>
                    <li>
                      {' '}
                      - 적용 대상: 키, 몸무게, 온도, 주가 등 <b>연속형 숫자 데이터</b>
                    </li>
                    <li>
                      {' '}
                      - 언제 사용?: 데이터가 정규 분포와 비슷하고, <b>이상치에 덜 민감한 경우</b>
                    </li>
                    <li> - 예시: 신용 평가 모델에서 소득, 채무 등의 변수</li>
                    <li> - 평균 0, 표준편차 1로 맞춰요.</li>
                  </ul>
                </li>
                <li>
                  <ul>
                    <b>Min-Max 정규화</b>
                    <li>
                      {' '}
                      - 적용 대상: 연령, 점수, 등급 등 <b>범위가 제한된 숫자 데이터</b>
                    </li>
                    <li>
                      {' '}
                      - 언제 사용?: 데이터의 상대적 크기가 중요하고, <b>모든 값을 0~1 사이로 보고 싶을 때</b>
                    </li>
                    <li> - 예시: 이미지 픽셀 값, 추천 시스템의 평점 데이터</li>
                    <li> - 0과 1 사이 값으로 맞춰요.</li>
                  </ul>
                </li>

                <li>
                  <ul>
                    <b>로그 변환</b>
                    <li>
                      {' '}
                      - 적용 대상: 매출, 인구, 면적 등 <b>큰 수와 작은 수 차이가 극단적인 데이터</b>
                    </li>
                    <li>
                      {' '}
                      - 언제 사용?: 데이터의 분포가 <b>한 쪽으로 치우쳐 있을 때 (오른쪽 꼬리가 긴 경우)</b>
                    </li>
                    <li> - 예시: 집값, 연봉, 제품 판매량</li>
                  </ul>
                </li>

                <li>
                  <ul>
                    <b>제곱근 변환</b>
                    <li>
                      {' '}
                      - 적용 대상: 빈도수, 개수 등 <b>양의 값만 가지는 데이터</b>
                    </li>
                    <li>
                      {' '}
                      - 언제 사용?: 로그보다 덜 강력한 변환이 필요할 때, <b>분산이 평균에 비례하는 데이터</b>
                    </li>
                    <li> - 예시: 고객 방문 횟수, 웹 사이트 클릭 수</li>
                  </ul>
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
                  <ul>
                    <b>원핫 인코딩</b>
                    <li>
                      {' '}
                      - 적용 대상: 성별, 지역, 색상 등 <b>범주형 데이터 (카테고리)</b>
                    </li>
                    <li>
                      {' '}
                      - 언제 사용?: 범주 간 <b>순서가 없고,</b> 범주 수가 많지 않을 때
                    </li>
                    <li> - 예시: 혈액형(A, B, O, AB), 결제 방식(카드, 현금, 포인트)</li>
                  </ul>
                </li>

                <li>
                  <ul>
                    <b>레이블 인코딩</b>
                    <li>
                      {' '}
                      - 적용 대상: 등급, 순위 등 <b>순서가 있는 범주형 데이터</b>
                    </li>
                    <li>
                      {' '}
                      - 언제 사용?: 범주 간에 <b>순서적 의미가 있을 때,</b> 의사결정트리 기반 모델
                    </li>
                    <li> - 예시: 학점(A, B, C, D, F), 고객 등급(VIP, Gold, Silver)</li>
                  </ul>
                </li>

                <li>
                  <ul>
                    <b>타겟 인코딩</b>
                    <li>
                      {' '}
                      - 적용 대상: 영향력이 높은 <b>범주형 변수</b>
                    </li>
                    <li>
                      {' '}
                      - 언제 사용?: 범주 수가 매우 많거나, 범주와 <b>목표값 사이에 관계가 있을 때 </b>
                    </li>
                    <li> - 예시: 우편 번호, 제품 카테고리</li>
                  </ul>
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

          <AccordionItem value="handling-string" className="overflow-hidden rounded-md border border-gray-200">
            <AccordionTrigger className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-100 data-[state=open]:bg-blue-50">
              <div className="flex items-center">
                <span className="font-tossface mr-2 text-lg">🧐</span>
                <span>문자열(String) 데이터는 어떻게 처리해야 할까요?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 bg-white px-5 py-4 text-sm leading-relaxed">
              <p className="font-semibold">문자열 데이터는 반드시 인코딩해야 합니다.</p>
              <p>대부분의 ML(머신러닝) 알고리즘은 숫자만 처리할 수 있기 때문입니다.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <ul>
                    <b>카테고리성 문자열</b>(예: 성별, 직업, 색상)
                    <li>
                      {' '}
                      - <b>적은 범주 수(~50개):</b> 원핫 인코딩
                    </li>
                    <li>
                      {' '}
                      - <b>중간 범주 수(~1,000개):</b> 레이블 인코딩(트리 모델용) 또는 타겟 인코딩
                    </li>
                    <li>
                      {' '}
                      - <b>많은 범주 수(1,000개 이상):</b> 임베딩 기법 또는 범주 그룹화 후 인코딩
                    </li>
                  </ul>
                </li>

                <li>
                  <ul>
                    <b>텍스트 데이터</b>(예: 리뷰, 기사, 댓글)
                    <li> - 텍스트 분석 기법 필요 (TF-IDF, 워드 임베딩 등)</li>
                  </ul>
                </li>

                <li>
                  <ul>
                    <b>ID나 코드</b>(예: 고객 ID, 제품 코드)
                    <li> - 대부분 제거하는 것이 좋음 (과적합 위험)</li>
                    <li> - 분석이 필요하다면 집계 특성으로 변환</li>
                  </ul>
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
