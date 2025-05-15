'use client';

import { useIsFetching } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { globalLoadingAtom } from '@/shared/model/atoms/GlobalLoadingAtom';

export const ReactQueryGlobalLoadingSync = () => {
  const isFetching = useIsFetching();
  const set = useSetAtom(globalLoadingAtom);

  useEffect(() => {
    set(isFetching > 0);
  }, [isFetching, set]);

  return null;
};
