import { downloadYourModel } from '@/shared/api/projectDetailApi';
import { IoMdDownload } from 'react-icons/io';

interface ApiDownloadCardProps {
  pipelineId: string;
}

export default function ApiDownloadCard({ pipelineId }: ApiDownloadCardProps) {
  const handleDownload = async () => {
    try {
      const response = await downloadYourModel(pipelineId);
      const { downloadUrl, fileName, fileSize } = response.data;
      const fileSizeMB = fileSize ? (fileSize / (1024 * 1024)).toFixed(2) : '알 수 없음';

      // 2. 프록시 API 엔드포인트를 사용하여 파일을 가져옵니다
      // URL에서 경로 부분만 추출 (http://54.180.212.247:30900 이후 부분)
      const filePathWithParams = downloadUrl.replace(/^https?:\/\/[^\/]+/, '');

      // Next.js API 경로를 통해 프록시 요청
      const proxyDownloadUrl = `/api/proxy-download?path=${encodeURIComponent(filePathWithParams)}`;

      // 동적으로 a 태그 생성하여 다운로드 트리거
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl; // 서명된 URL 설정
      downloadLink.download = fileName || `model-${pipelineId}.pkl`; // 파일명 설정
      document.body.appendChild(downloadLink);
      downloadLink.click(); // 다운로드 시작
      document.body.removeChild(downloadLink); // 사용 후 요소 제거
    } catch (e) {
      alert('다운로드 시작도 못함');
      console.error('다운로드 시작도 못함', e);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-row items-center justify-between gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:gap-4">
        <div className="w-full">
          <h2 className="mb-4 text-start text-xl font-semibold text-gray-800">모델 파일 다운로드</h2>
          <p className="text-start text-gray-600">학습된 AI 모델을 로컬 환경에서 바로 활용해보세요. 최적화된 파일을 통해 API 없이도 직접 예측을 실행하고, 자체 시스템에 통합할 수 있습니다.</p>
        </div>
        <button
          className="bg-[theme(primary-black)] h-20 w-44 flex-shrink-0 cursor-pointer rounded-lg text-white transition-transform duration-300 ease-out select-none hover:scale-105 hover:shadow-lg"
          onClick={handleDownload}
        >
          {/* 아이콘과 텍스트 중앙 정렬 */}
          <div className="flex h-full w-full items-center justify-center">
            {/* 아이콘 크기 증가 */}
            <IoMdDownload className="mr-3 h-6 w-6" />
            <div className="text-left">
              <p className="text-sm">모델 파일</p>
              <p className="font-semibold">내보내기</p>
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
