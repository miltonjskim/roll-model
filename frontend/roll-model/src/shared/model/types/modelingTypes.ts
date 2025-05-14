import { ColumnConfig } from '@/entities/workspace/data-config/model/types';
import { Step } from '@/entities/workspace/data-preprocess/model/types';
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
  columns: Record<string, string>;
}

export interface ForkPreprocessResponse {
  pipelineId: string;
  category: projectCategory;
  preprocessingSteps: Step[];
}
