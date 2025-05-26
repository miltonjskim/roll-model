'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { globalLoadingAtom } from '@/shared/model/atoms/GlobalLoadingAtom';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export default function GlobalFallbackLoading() {
  const setLoading = useSetAtom(globalLoadingAtom);

  useEffect(() => {
    setLoading(true);
    return () => setLoading(false);
  }, [setLoading]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <LoadingSpinner />
    </div>
  );
}
