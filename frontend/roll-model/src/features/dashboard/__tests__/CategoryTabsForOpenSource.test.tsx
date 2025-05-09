import { CategoryTabsForOpenSource } from '@/features/dashboard/CategoryTabsForOpenSource';
import { render, screen, fireEvent } from '@testing-library/react';

describe('CategoryTabsForOpenSource', () => {
  // 기본 props 정의
  const defaultProps = {
    selectedCategory: 'all' as const,
    selectedSort: 'recent' as const,
    onCategoryChange: jest.fn(),
    onSortChange: jest.fn(),
  };

  // 컴포넌트 테스트 :화면보이고 버튼 눌리고 이런거 테스트함
  // 테스트 1번 : 테스트 명 " renders all ...어쩌구"
  // CategoryTabsForOpenSource에 대해 테스트함 props로 defaultProps를 넣음
  // 됨?(expect) 화면(screen)에 '전체'라는 텍스트(getByText)가 요소로 있음?(toBeInTheDocument)
  // 모든 expect가 성공시 테스트 1번 성공!
  test('renders all category tabs and sort options', () => {
    render(<CategoryTabsForOpenSource {...defaultProps} />);

    // 카테고리 탭이 렌더링되었는지 확인
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('분류')).toBeInTheDocument();
    expect(screen.getByText('회귀')).toBeInTheDocument();

    // 정렬 옵션이 렌더링되었는지 확인
    expect(screen.getByText('최신')).toBeInTheDocument();
    // expect(screen.getByText('인기')).toBeInTheDocument();
  });

  // 테스트 2번 : CLASSIFICATION,popular 버튼 눌러보기
  // 버튼 명 혹은 색상 변경시 테스트 코드 수정해야됨
  test('applies active styles to selected category and sort option', () => {
    // 특정 카테고리와 정렬 옵션이 선택된 상태로 렌더링
    render(<CategoryTabsForOpenSource {...defaultProps} selectedCategory="CLASSIFICATION" selectedSort="name" />);

    // 선택된 카테고리와 정렬 옵션은 다른 스타일을 가지므로
    // 클래스명을 확인하거나 스타일을 확인할 수 있습니다
    // 여기서는 텍스트 색상이 변경된다고 가정합니다

    // 분류 버튼이 선택되었는지 확인 (선택된 버튼은 bg-white 클래스를 가짐)
    const classificationButton = screen.getByText('분류');
    expect(classificationButton).toHaveClass('bg-white');

    // 인기 버튼이 선택되었는지 확인
    const popularButton = screen.getByText('인기');
    expect(popularButton).toHaveClass('bg-white');

    // 선택되지 않은 버튼은 bg-white 클래스가 없어야 함
    const allButton = screen.getByText('전체');
    expect(allButton).not.toHaveClass('bg-white');
  });

  // 테스트3번 : 분류버튼 눌러보기(fireEvent.click)
  // 너가 받아온 props중 onCategoryChange에 의해 CLASSIFICATION이 호출(toHaveBeenCalledWith) 되었는지 확인
  test('calls onCategoryChange when a category tab is clicked', () => {
    render(<CategoryTabsForOpenSource {...defaultProps} />);

    // 분류 버튼 클릭
    fireEvent.click(screen.getByText('분류'));

    // onCategoryChange가 호출되었는지 확인
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('CLASSIFICATION');
  });

  // 테스트4번 : 동일한 방식으로 onSortChange 동작하는지 확인
  test('calls onSortChange when a sort option is clicked', () => {
    render(<CategoryTabsForOpenSource {...defaultProps} />);

    // 인기 버튼 클릭
    fireEvent.click(screen.getByText('인기'));

    // onSortChange가 호출되었는지 확인
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('popular');
  });
});
