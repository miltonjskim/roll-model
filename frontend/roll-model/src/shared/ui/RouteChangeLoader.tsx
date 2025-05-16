'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { globalLoadingAtom, globalLoadingMessageAtom } from '@/shared/model/atoms/GlobalLoadingAtom';

export const RouteChangeLoader = () => {
  const pathname = usePathname();
  const setLoading = useSetAtom(globalLoadingAtom);
  const setLoadingMessage = useSetAtom(globalLoadingMessageAtom);

  useEffect(() => {
    setLoading(true);
    setLoadingMessage('페이지를 이동하고 있어요.\n잠시만 기다려주세요.');
    const timeout = setTimeout(() => {
      setLoading(false);
      setLoadingMessage(null);
    }, 500); // 최소 로딩 유지 시간

    return () => clearTimeout(timeout);
  }, [pathname, setLoading, setLoadingMessage]);

  return null;
};
