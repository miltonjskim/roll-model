import { Step } from '@/entities/workspace/data-preprocess/model/types';

export const processClearSteps = (step: Step): Record<string, unknown> => {
  const { categoryId, optionId, parameters } = step;
  const body: Record<string, unknown> = {};

  const setColumn = () => {
    if (parameters?.column) body.column = parameters.column;
  };

  switch (categoryId) {
    case 'missing_values': {
      setColumn();
      if (optionId === 'remove-rows') {
        body.type = 'MISSING_VALUE_REMOVE';
        body.method = 'ROW_REMOVE';
      } else if (optionId === 'drop-columns') {
        body.type = 'MISSING_VALUE_REMOVE';
        body.method = 'COL_REMOVE';
      } else {
        body.type = 'MISSING_VALUE_IMPUTATION';
        body.method = parameters.method;
      }
      break;
    }

    case 'outlier_handle': {
      setColumn();
      body.detection = 'ZSCORE';

      if (optionId === 'remove-rows') {
        body.type = 'OUTLIER_REMOVE';
        body.method = 'ROW_REMOVE';
      } else if (optionId === 'drop-columns') {
        body.type = 'OUTLIER_REMOVE';
        body.method = 'COL_REMOVE';
      } else {
        body.type = 'OUTLIER_IMPUTATION';
        body.method = parameters.method;
      }
      break;
    }

    case 'outlier_detection': {
      setColumn();
      body.type = 'OUTLIER_DETECTION';
      body.detection = parameters.detection;
      break;
    }

    case 'data_transformation': {
      setColumn();
      switch (optionId) {
        case 'z-score':
          body.type = 'ZSCORE_SCALING';
          break;
        case 'min-max':
          body.type = 'MINMAX_SCALING';
          break;
        case 'log':
          body.type = 'LOG_TRANSFORM';
          body.offset = parameters.offset;
          break;
        case 'sqrt':
          body.type = 'SQRT_TRANSFORM';
          break;
      }
      break;
    }

    case 'encoding': {
      setColumn();
      switch (optionId) {
        case 'one-hot':
          body.type = 'ONEHOT_ENCODING';
          break;
        case 'label':
          body.type = 'LABEL_ENCODING';
          break;
        case 'target':
          body.type = 'TARGET_ENCODING';
          body.targetColumn = parameters.targetColumn;
          break;
      }
      break;
    }

    case 'class_balancing': {
      setColumn();
      body.type = 'CLASS_BALANCING';
      body.samplingRatio = parameters.samplingRatio;
      body.method = parameters.method;
      break;
    }

    case 'col_handle': {
      if (optionId === 'drop') {
        body.type = 'COLUMN_DROP';
        body.columns = parameters.columns;
      } else if (optionId === 'keep') {
        body.type = 'COLUMN_KEEP';
        body.columns = parameters.columns;
      }
      break;
    }
  }

  return body;
};
