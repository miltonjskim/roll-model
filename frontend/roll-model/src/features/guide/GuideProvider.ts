'use client';

import Shepherd from 'shepherd.js';

export const guide = new Shepherd.Tour({
  defaultStepOptions: {
    scrollTo: true,
    cancelIcon: {
      enabled: true,
    },
    classes: 'shepherd-theme-default',
  },
  useModalOverlay: true,
});
