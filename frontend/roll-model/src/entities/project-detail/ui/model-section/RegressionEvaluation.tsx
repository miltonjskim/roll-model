import { ActualVsPredicted, ResidualPlot } from '@/entities/project-detail/model/ModelTypes';

interface RegressionEvaluationProps {
  actualVsPredicted: ActualVsPredicted;
  residualPlot: ResidualPlot;
}

export default function RegressionEvaluation({ actualVsPredicted, residualPlot }: RegressionEvaluationProps) {
  return <></>;
}
