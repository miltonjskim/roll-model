export const formatNumber = (num: number | string): string => {
  // 문자열인 경우 숫자로 변환 시도
  if (typeof num === 'string') {
    // 숫자로 변환 가능한지 확인
    const parsedNum = parseFloat(num);
    if (isNaN(parsedNum)) {
      return num; // 숫자로 변환할 수 없는 문자열은 그대로 반환
    }
    num = parsedNum; // 숫자로 변환 성공하면 num에 할당
  }

  if (num === null || num === undefined) return '-';

  // 소수점 이하 최대 2자리로 제한하기
  const limitDecimals = (n: number): number => {
    return Math.round(n * 100) / 100;
  };

  if (num >= 1_000_000_000) {
    return (
      limitDecimals(num / 1_000_000_000)
        .toFixed(1)
        .replace(/\.0$/, '') + 'B'
    );
  }
  if (num >= 1_000_000) {
    return (
      limitDecimals(num / 1_000_000)
        .toFixed(1)
        .replace(/\.0$/, '') + 'M'
    );
  }
  if (num >= 1_000) {
    return (
      limitDecimals(num / 1_000)
        .toFixed(1)
        .replace(/\.0$/, '') + 'k'
    );
  }

  // 정수인 경우 소수점 없이 표시, 소수인 경우 최대 2자리까지만 표시
  return Number.isInteger(num)
    ? num.toLocaleString()
    : limitDecimals(num).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
};
