// /entities/project-detail/ui/CorrelationMatrix.tsx
import { CorrelationMatrix as CorrelationMatrixType } from '@/entities/project-detail/model/dataTypes';
import { CssDetailHovering } from '@/widgets/project/project-detail/ProjectDetailCard';
import { useState } from 'react';

interface CorrelationMatrixProps {
  correlationMatrix: CorrelationMatrixType;
}

export const CorrelationMatrix = ({ correlationMatrix }: CorrelationMatrixProps) => {
  const { featureNames, matrix } = correlationMatrix;

  // 선택된 셀의 행과 열 인덱스를 저장할 상태 추가
  const [selectedCell, setSelectedCell] = useState<{ row: number | null; col: number | null }>({
    row: null,
    col: null,
  });

  // 셀 클릭 이벤트 핸들러
  const handleCellClick = (rowIdx: number, colIdx: number) => {
    // 이미 선택된 셀을 다시 클릭하면 선택 해제
    if (selectedCell.row === rowIdx && selectedCell.col === colIdx) {
      setSelectedCell({ row: null, col: null });
    } else {
      // 다른 셀을 클릭하면 해당 셀 선택
      setSelectedCell({ row: rowIdx, col: colIdx });
    }
  };

  // 셀이 현재 선택된 행이나 열에 속하는지 확인하는 함수
  const isHighlighted = (rowIdx: number, colIdx: number) => {
    return (
      selectedCell.row === null || // 아무 것도 선택되지 않았거나
      selectedCell.row === rowIdx || // 선택된 행이거나
      selectedCell.col === colIdx // 선택된 열이거나
    );
  };

  // 선택된 셀의 상관관계에 대한 설명 생성
  const getCorrelationDescription = () => {
    if (selectedCell.row === null || selectedCell.col === null) return null;

    // 같은 변수를 선택한 경우
    if (selectedCell.row === selectedCell.col) {
      return (
        <div className="bg-[theme(color-blue-05)] mt-4 rounded-md p-3">
          <p className="font-medium">
            <span className="text-[theme(color-blue-01)]">{featureNames[selectedCell.row]}</span>: 자기 자신과의 상관관계입니다.
          </p>
          <p className="mt-1 text-sm">이 값은 항상 1.0입니다. 변수는 자신과 완벽하게 연관되어 있습니다.</p>
        </div>
      );
    }

    const value = matrix[selectedCell.row][selectedCell.col];
    const absValue = Math.abs(value);
    const feature1 = featureNames[selectedCell.row];
    const feature2 = featureNames[selectedCell.col];

    let strengthText = '';
    let explanationText: React.ReactNode = '';

    // 상관관계 강도 설명
    if (absValue > 0.7) strengthText = '매우 강한';
    else if (absValue > 0.5) strengthText = '강한';
    else if (absValue > 0.3) strengthText = '중간 정도의';
    else if (absValue > 0.1) strengthText = '약한';
    else strengthText = '거의 없는';

    // 배경색 설정
    const bgColor = value > 0 ? 'bg-[theme(color-blue-05)]' : 'bg-[theme(color-rose-05)]';
    const textColor = value > 0 ? 'text-[theme(color-blue-01)]' : 'text-[theme(color-rose-01)]';

    // 상관관계 설명

    if (value > 0) {
      explanationText = (
        <>
          <span className={textColor}>{feature1}</span>이(가) 증가하면 <span className={textColor}>{feature2}</span>도 증가하는 경향이 있습니다.
        </>
      );
    } else if (value < 0) {
      explanationText = (
        <>
          <span className={textColor}>{feature1}</span>이(가) 증가하면 <span className={textColor}>{feature2}</span>은(는) 감소하는 경향이 있습니다.
        </>
      );
    } else {
      explanationText = (
        <>
          <span className={textColor}>{feature1}</span>과(와) <span className={textColor}>{feature2}</span> 사이에는 선형적인 관계가 없습니다.
        </>
      );
    }

    return (
      <div className={`mt-4 p-3 ${bgColor} rounded-md`}>
        <p className="font-medium">
          <span className={textColor}>{feature1}</span>과(와) <span className={textColor}>{feature2}</span> 사이에는
          {value > 0 ? ' 양의 ' : value < 0 ? ' 음의 ' : ' '}
          상관관계<span className={`${textColor} bg-[theme(color-gray-04)] mx-1 rounded-md px-1 py-0.5`}>{value.toFixed(2)}</span>가 있습니다.
        </p>
        <p className="mt-1 text-sm">
          이것은 <strong>{strengthText}</strong> 상관관계입니다. {explanationText}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-[theme(color-card-background)] mb-4 rounded-lg p-4 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="bg-[theme(color-muted)] px-4 py-2"></th>
              {featureNames.map((name, i) => (
                <th key={i} className={`bg-[theme(color-muted)] px-4 py-2 font-medium ${selectedCell.col === i ? 'bg-[theme(color-blue-05)]' : ''}`}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className={`bg-[theme(color-muted)] px-4 py-2 font-medium ${selectedCell.row === rowIdx ? 'bg-[theme(color-blue-05)]' : ''}`}>{featureNames[rowIdx]}</td>
                {row.map((value, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-2 text-center ${CssDetailHovering} cursor-pointer`}
                    style={{
                      backgroundColor: getCorrelationColor(value, rowIdx, colIdx),
                      color: Math.abs(value) > 0.5 ? 'var(--primary-white)' : 'var(--primary-black)',
                      opacity: isHighlighted(rowIdx, colIdx) ? 1 : 0.1, // 하이라이트되지 않은 셀은 어둡게
                      transition: 'opacity 0.3s ease', // 부드러운 전환 효과
                    }}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                  >
                    {value.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상관관계 설명 */}
      {getCorrelationDescription()}

      {selectedCell.row !== null && <div className="text-[theme(color-muted-foreground)] mt-2 text-sm">* 표의 아무 위치나 다시 클릭하면 하이라이트가 해제됩니다.</div>}
    </div>
  );
};

// 상관계수에 따른 색상 지정 (기존 함수 유지)
const getCorrelationColor = (value: number, rowIdx?: number, colIdx?: number): string => {
  // 대각선 요소(자기 자신과의 상관관계)는 검은색
  if (rowIdx !== undefined && colIdx !== undefined && rowIdx === colIdx) {
    return 'var(--primary-black)';
  }
  // 절대값 기준으로 색상 강도 결정
  const absValue = Math.abs(value);

  if (value > 0) {
    // 양의 상관관계: 더 미묘하게 변화하는 파란색 계열
    if (absValue > 0.7) return '#96b4fa'; // 매우 강한 양의 상관관계
    if (absValue > 0.5) return '#a1bbfb'; // 강한 양의 상관관계
    if (absValue > 0.3) return '#acc2fb'; // 중간 양의 상관관계
    if (absValue > 0.1) return '#b7c9fc'; // 약한 양의 상관관계
    if (absValue > 0.01) return '#D2DEFF'; // 약한 양의 상관관계
    return 'var(--primary-white)'; // 매우 약한 양의 상관관계
  } else {
    // 음의 상관관계: 더 미묘하게 변화하는 분홍색 계열
    if (absValue > 0.7) return '#ffaab2'; // 매우 강한 음의 상관관계
    if (absValue > 0.5) return '#ffb3ba'; // 강한 음의 상관관계
    if (absValue > 0.3) return '#ffbbc3'; // 중간 음의 상관관계
    if (absValue > 0.1) return '#ffc7cd'; // 약한 음의 상관관계
    if (absValue > 0.01) return '#FFEAEC'; // 약한 음의 상관관계
    return 'var(--primary-white)'; // 매우 약한 음의 상관관계
  }
};
