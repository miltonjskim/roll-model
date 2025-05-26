import { CellValue, ColumnConfig } from '@/entities/workspace/data-config/model/types';
import { PreviousPreprocessingSteps, Step } from '@/entities/workspace/data-preprocess/model/types';
import { projectCategory } from '@/entities/workspace/model/types';

export type DataSplit = {
  trainRatio: number;
  testRatio: number;
  validationRatio: number;
  randomSeed: number;
};

export interface ForkTotalResponse extends ForkPreprocessResponse {
  modelingInfo: {
    algorithm: string;
    dataSplit: DataSplit;
    parameters: Record<string, number>;
    targetFeature: string;
  };
  columns: ColumnConfig[];
}

export interface ForkPreprocessResponse {
  pipelineId: string;
  category: projectCategory;
  preprocessingSteps: PreviousPreprocessingSteps[];
  columns: ColumnConfig[];
  dataset: Array<Record<string, CellValue>>;
  summary: {
    totalRows: number; // 총 행 수
    totalColumns: number; // 총 열 수
    filename?: string; // 파일 이름
    encoding?: string; // 인코딩 방식
    delimiter?: string; // 구분자
    customDelimiter?: string; // 커스텀 구분자를 사용했는지
    missingValues: {
      columns: string[]; // 결측치가 존재하는 컬럼명 배열
      details: {
        [column: string]: {
          count: number; // 결측치 행 개수
          percentage: number; // 결측치 비율
          rowIndices: number[]; // 몇 번째 행이 결측치인지
        };
      };
    };
  };
}
