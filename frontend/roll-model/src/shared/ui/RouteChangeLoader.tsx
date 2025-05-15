'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { globalLoadingAtom } from '@/shared/model/atoms/GlobalLoadingAtom';

export const RouteChangeLoader = () => {
  const pathname = usePathname();
  const setLoading = useSetAtom(globalLoadingAtom);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 500); // 최소 로딩 유지 시간

    return () => clearTimeout(timeout);
  }, [pathname, setLoading]);

  return null;
};
