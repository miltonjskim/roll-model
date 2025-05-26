import { guide } from '@/features/guide/GuideProvider';

export const startGuide = () => {
  if (!guide.isActive()) {
    guide.start();
  }
};

export const completeGuide = () => {
  if (guide.isActive()) {
    guide.complete();
  }
};
