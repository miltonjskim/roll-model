'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Database, Code, BarChart3, Cloud, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // 스크롤 위치에 따라 활성 섹션 결정
      const sectionHeight = window.innerHeight;
      const current = Math.floor((window.scrollY + 100) / sectionHeight);
      console.log('current:', current);

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToGuide = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  const moveToWorkspace = () => {
    router.push('/workspace');
  };

  return (
    <div className="w-full">
      {/* 메인 섹션 */}
      <section className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-transparent to-white px-6 md:px-24">
        <div className="max-w-5xl">
          <p className="mb-4 font-normal tracking-widest text-blue-500" style={{ opacity: 1 - scrollY / 400 }}>
            누구나 쉽게 만드는 AI 모델
          </p>

          <div
            className="mb-7 text-3xl leading-tight md:text-5xl"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              opacity: 1 - scrollY / 400,
            }}
          >
            <h1 className="font-normal">데이터만 있다면,</h1>
            <h1 className="font-bold">모델 개발부터 배포까지, 클릭 한 번에!</h1>
          </div>

          <p
            className="tracking-wider text-gray-600"
            style={{
              transform: `translateY(${scrollY * 0.2}px)`,
              opacity: 1 - scrollY / 300,
            }}
          >
            데이터만 있다면 누구나 클릭 몇 번으로 모델을 개발하고 배포할 수 있습니다.
            <br />
            AI가 추천하는 전처리와 다양한 모델 학습 알고리즘, 직관적인 모델 평가 대시보드를 제공합니다.
            <br />
            학습된 모델은 자동으로 배포되며, API를 통해 쉽게 활용하고 재학습할 수 있습니다.
          </p>

          <div className="mt-12 flex items-center justify-center space-x-6">
            <Button size="lg" variant="black" onClick={moveToWorkspace}>
              시작하기
            </Button>
          </div>
        </div>

        <div className="absolute bottom-10 flex animate-bounce cursor-pointer flex-col items-center" onClick={scrollToGuide} style={{ opacity: 1 - scrollY / 200 }}>
          <p className="mb-1 text-gray-500">가이드 보기</p>
          <ChevronDown size={24} className="text-gray-500" />
          <ChevronDown size={24} className="-mt-4 text-gray-500" />
        </div>
      </section>

      {/* 가이드 섹션 */}
      <section className="min-h-screen bg-gray-50 px-6 py-20 md:px-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold">AI 모델 개발 가이드</h2>
          <p className="mb-16 text-center text-gray-600">클릭 몇 번으로 AI 모델을 개발하고 배포하는 전체 과정을 알아보세요</p>

          {/* 가이드 스텝 */}
          <div className="space-y-24">
            {/* 스텝 1 */}
            <div className={`flex flex-col items-center md:flex-row ${activeSection >= 1 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-500`}>
              <div className="mb-8 md:mb-0 md:w-1/2 md:pr-8">
                <div className="mb-4 flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Database size={24} />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">1. 데이터 업로드</h3>
                </div>
                <p className="mb-4 text-left text-gray-600">
                  다양한 형식의 데이터를 간단히 업로드하고, <br />
                  데이터 설정도 간편하게 마쳐보세요.{' '}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    CSV, parquet 등 다양한 파일 형식 지원
                  </li>
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    여러 종의 샘플 데이터셋 제공
                  </li>
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    데이터 헤더 유형 자동 설정 및 구분자, 인코딩 지원
                  </li>
                </ul>
              </div>
              <div className="flex justify-center md:w-1/2">
                <Image src="/guide/upload_data.svg" alt="data-upload-image" width={400} height={200} />
              </div>
            </div>

            {/* 스텝 2 */}
            <div className={`flex flex-col items-center md:flex-row ${activeSection >= 1 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-500`}>
              <div className="order-1 mb-8 flex justify-center md:order-none md:mb-0 md:w-3/5">
                <Image src="/guide/data_preprocessing.svg" alt="data-upload-image" width={500} height={200} />
              </div>
              <div className="md:w-2/5 md:pl-8">
                <div className="mb-4 flex items-center justify-end">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Code size={24} />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">2. AI 자동 전처리</h3>
                </div>
                <p className="mb-4 text-right text-gray-600">
                  AI가 데이터를 분석해서
                  <br /> 최적의 전처리 방법을 자동으로 추천합니다.
                  <br /> 복잡한 코딩 없이 데이터를 정제할 수 있습니다.
                </p>
                <ul className="space-y-2 text-right">
                  <li className="flex items-center justify-end text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    AI 기반 데이터 전처리 방법 자동 추천 및 일괄 전처리
                  </li>
                  <li className="flex items-center justify-end text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    다양한 전처리 옵션을 제공해 빠르고 간단한 데이터 전처리
                  </li>
                </ul>
              </div>
            </div>

            {/* 스텝 3 */}
            <div className={`flex flex-col items-center md:flex-row ${activeSection >= 2 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-500`}>
              <div className="mb-8 md:mb-0 md:w-1/2 md:pr-8">
                <div className="mb-4 flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <BarChart3 size={24} />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">3. 모델 학습 및 평가</h3>
                </div>
                <p className="mb-4 text-left text-gray-600">
                  최적의 알고리즘을 자동으로 선택하고 하이퍼파라미터를 튜닝하여 <br />
                  가장 성능이 좋은 모델을 찾아냅니다.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    다양한 알고리즘 자동 비교
                  </li>
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    직관적인 성능 평가 대시보드
                  </li>
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    모델 설명 기능
                  </li>
                </ul>
              </div>
              <div className="flex justify-center md:w-1/2">
                <Image src="/guide/modeling.svg" alt="data-upload-image" width={500} height={200} />
              </div>
            </div>

            {/* 스텝 4 */}
            <div className={`flex flex-col items-center md:flex-row ${activeSection >= 2 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-500`}>
              <div className="order-1 mb-8 flex justify-center md:order-none md:mb-0 md:w-1/2">
                <Image src="/guide/export_model.svg" alt="data-upload-image" width={600} height={200} />
              </div>
              <div className="md:w-1/2 md:pl-8">
                <div className="mb-4 flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Cloud size={24} />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold">4. 모델 배포 및 활용</h3>
                </div>
                <p className="mb-4 text-left text-gray-600">
                  학습된 모델은 자동으로 배포되어 API를 통해 즉시 사용할 수 있습니다. <br />
                  필요에 따라 재학습하고 버전을 관리할 수 있습니다.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    클릭 한 번으로 API 배포
                  </li>
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    모델 버전 관리
                  </li>
                  <li className="flex items-center text-gray-600">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    모니터링 및 성능 추적
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA 섹션 */}
          <div className="mt-32 text-center">
            <h2 className="mb-6 text-2xl font-bold">지금 바로 AI 모델을 만들어보세요</h2>
            <p className="mb-8 text-gray-600">코딩 지식 없이도 데이터 기반의 의사결정을 내릴 수 있습니다</p>
            <Button className="mx-auto flex items-center justify-center rounded-full" size="lg" onClick={moveToWorkspace}>
              데이터 전처리 및 AI 모델 만들러 가기
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
