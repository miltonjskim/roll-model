import { ColumnConfig } from '@/entities/workspace/data-config/model/types';
import { projectCategory } from '@/entities/workspace/model/types';
import { Step } from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';

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
  preprocessingSteps: Step[];
}
