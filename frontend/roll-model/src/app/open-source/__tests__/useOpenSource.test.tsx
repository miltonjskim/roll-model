import { renderHook, act, waitFor } from "@testing-library/react";
import { useOpenSource } from "../model/useOpenSource";
import {
  fetchOpenSourceData,
  fetchFilteredOpenSourceProjects,
} from "@/shared/api/openSourceApi";

// API 호출을 모킹(실제 api호출안함)합니다 : 이걸해주는게 jest.mock
// jest.fn()읉 통해 모킹함수 생성 => 이걸로 "호출 여부, 호출 횟수, 전달된 인자" 등 알아냄
jest.mock("@/shared/api/openSourceApi", () => ({
  fetchOpenSourceData: jest.fn(),
  fetchFilteredOpenSourceProjects: jest.fn(),
}));

describe("useOpenSource", () => {
  // 각 테스트 케이스 실행 전에 모킹된 함수를 초기화합니다
  // 곧, 각 테케들이 독립적으로 실행됨
  beforeEach(() => {
    // 초기화시킴
    jest.clearAllMocks();

    // 기본 모킹 데이터 설정 (API 응답용 데이터)
    const mockData = {
      data: {
        currentPage: 1, // 현재 페이지 번호
        totalPages: 2, // 전체 페이지 수
        totalElements: 15, // 전체 항목 수
        last: false, // 마지막 페이지 여부
        projects: [
          // 프로젝트 목록
          {
            id: 1, // 프로젝트 ID
            title: "테스트 프로젝트 1", // 프로젝트 제목
            version: "1.0", // 버전
            category: "CLASSIFICATION", // 프로젝트 유형 (분류)
            writerId: 1, // 작성자 ID
            writerNickname: "tester", // 작성자 닉네임
            domain: "FINANCE", // 프로젝트 도메인 (원본값)
            displayDomain: "금융", // 표시용 도메인 (한글)
            accuracy: 0.95, // 정확도 (분류 모델의 성능 지표)
            rmse: null, // RMSE(Root Mean Square Error, 회귀 모델에서 사용하는 오차 지표)
            target: "신용등급", // 목표 변수
            dataCount: 1000, // 데이터 수
            runnungDuration: 120, // 실행 시간(초)
            likeCount: 10, // 좋아요 수
            downloadCount: 5, // 다운로드 수
            visibility: true, // 공개 여부
            createdAt: "2024-05-01T00:00:00", // 생성 시간
            updatedAt: "2024-05-01T12:00:00", // 업데이트 시간
          },
          {
            id: 2,
            title: "테스트 프로젝트 2",
            version: "1.0",
            category: "REGRESSION", // 프로젝트 유형 (회귀)
            writerId: 2,
            writerNickname: "developer",
            domain: "HEALTHCARE",
            displayDomain: "의료",
            accuracy: null, // 회귀 모델은 accuracy 대신 rmse를 사용
            rmse: 0.05, // 회귀 모델의 성능 지표 (낮을수록 좋음)
            target: "혈압",
            dataCount: 2000,
            runnungDuration: 180,
            likeCount: 15,
            downloadCount: 8,
            visibility: true,
            createdAt: "2024-04-28T00:00:00",
            updatedAt: "2024-04-29T12:00:00",
          },
        ],
      },
    };

    // fetchOpenSourceData 호출시 mockData 반환하도록 함
    // mockResolvedValue는 Promise를 반환하는 비동기 함수를 모킹할 때 사용함 (?흠..)
    (fetchOpenSourceData as jest.Mock).mockResolvedValue(mockData);

    // fetchFilteredOpenSourceProjects도 동일한 데이터를 반환하도록 설정함
    (fetchFilteredOpenSourceProjects as jest.Mock).mockResolvedValue(mockData);
  });
  // 아무튼 여기까지가 모킹 세팅

  // 1 : 초기 데이터 로딩 기능 테스트
  test("초기 데이터를 불러오고 상태를 업데이트한다", async () => {
    // renderHook 함수를 사용하여 useOpenSource 훅을 렌더링합니다.
    // 이를 통해 컴포넌트 없이도 훅을 테스트할 수 있습니다.
    // result에는 훅의 반환값이 담깁니다.
    const { result } = renderHook(() => useOpenSource());

    // 초기 상태는 로딩 중이어야 합니다.
    // result.current는 현재 훅의 반환값을 가리킵니다.
    expect(result.current.isLoading).toBe(true);

    // waitFor는 비동기 작업이 완료될 때까지 기다리는 함수입니다.
    // API 응답이 처리되고 상태가 업데이트될 때까지 기다립니다.
    await waitFor(() => {
      // 로딩이 완료되면 isLoading이 false가 되어야 합니다.
      expect(result.current.isLoading).toBe(false);
    });

    // API 함수가 정확히 1번 호출되었는지 확인합니다.
    // 이는 중복 호출이나 불필요한 호출이 없는지 검증합니다.
    expect(fetchOpenSourceData).toHaveBeenCalledTimes(1);

    // 데이터가 올바르게 상태에 저장되었는지 확인합니다.
    expect(result.current.openSourceData).not.toBeNull(); // 데이터가 null이 아님
    expect(result.current.filteredProjects.length).toBe(2); // 프로젝트가 2개 있음
    expect(result.current.error).toBeNull(); // 에러가 없음
  });

  // 2 : API 오류 처리 기능 테스트
  test("API 호출이 실패하면 에러 상태가 설정된다", async () => {
    // API 호출이 실패하도록 설정합니다.
    // mockRejectedValue는 Promise가 reject되도록(실패하도록) 설정합니다.
    // 일부러 error 쑤셔넣기
    (fetchOpenSourceData as jest.Mock).mockRejectedValue(new Error("API 에러"));

    // 렌더링
    const { result } = renderHook(() => useOpenSource());

    // API 응답 대기(비동기)
    await waitFor(() => {
      // 로딩완료
      expect(result.current.isLoading).toBe(false);
    });

    // 에러 상태 확인
    expect(result.current.error).not.toBeNull(); // 에러가 존재함
    expect(result.current.openSourceData).toBeNull(); // 데이터는 null임
  });

  // 3 : 카테고리 필터링 기능 테스트
  test("카테고리 변경 시 필터링 API가 호출된다", async () => {
    const { result } = renderHook(() => useOpenSource());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // act 함수는 React의 상태 업데이트를 테스트할 때 사용합니다.
    // 이는 React의 상태 업데이트가 일괄 처리되는 방식을 시뮬레이션합니다.
    act(() => {
      // 카테고리를 '분류(CLASSIFICATION)'로 변경합니다.
      result.current.handleCategoryChange("CLASSIFICATION");
    });

    // 필터링 API가 호출되었는지 확인합니다.
    // 디바운스(지연 실행) 처리 때문에 약간의 지연이 있을 수 있어 waitFor 사용
    await waitFor(() => {
      // toHaveBeenCalledWith는 함수가 특정 인자와 함께 호출되었는지 확인합니다.
      expect(fetchFilteredOpenSourceProjects).toHaveBeenCalledWith(
        "CLASSIFICATION", // 변경된 카테고리
        "", // 기본 검색어 (빈 문자열)
        "recent" // 기본 정렬 옵션 (최신순)
      );
    });
  });

  // 4 : 정렬 옵션 변경 기능 테스트
  test("정렬 옵션 변경 시 필터링 API가 호출된다", async () => {
    const { result } = renderHook(() => useOpenSource());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 인기순 클릭
    act(() => {
      result.current.handleSortChange("popular");
    });

    // 필터링 API가 올바른 인자와 함께 호출되었는지 확인합니다.
    await waitFor(() => {
      expect(fetchFilteredOpenSourceProjects).toHaveBeenCalledWith(
        "all", // 기본 카테고리 (전체)
        "", // 기본 검색어 (빈 문자열)
        "popular" // 변경된 정렬 옵션 (인기순)
      );
    });
  });

  // 5 : 검색 기능 테스트
  test("검색어 입력 시 필터링 API가 호출된다", async () => {
    const { result } = renderHook(() => useOpenSource());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 검색어 '테스트' 입력
    act(() => {
      result.current.handleSearch("테스트");
    });

    // 확인
    await waitFor(() => {
      expect(fetchFilteredOpenSourceProjects).toHaveBeenCalledWith(
        "all", // 기본 카테고리 (전체)
        "테스트", // 변경된 검색어
        "recent" // 기본 정렬 옵션 (최신순)
      );
    });
  });
});