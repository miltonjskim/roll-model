import { ColumnConfig } from '@/entities/workspace/data-config/model/types';
import { projectCategory } from '@/entities/workspace/model/types';
import { Step } from '@/features/workspace/data-preprocess/ui/PreprocessingPipeline';

export type DataSplit = {
  trainRatio: number;
  testRatio: number;
  validationRatio: number;
  randomSeed: number;
};

export interface ForkTotalResponse {
  pipelineId: string;
  category: projectCategory;
  registeredAt: string;
  modifiedAt: string;
  preprocessingSteps: Step[];
  modelingInfo: {
    algorithm: string;
    dataSplit: DataSplit;
    parameters: Record<string, number>;
    targetFeature: string;
  };
  columns: ColumnConfig[];
}
