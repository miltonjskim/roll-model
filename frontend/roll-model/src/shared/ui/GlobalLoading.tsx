'use client';

import { useAtomValue } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import { globalLoadingAtom, globalLoadingMessageAtom } from '@/shared/model/atoms/GlobalLoadingAtom';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

const GlobalLoading = () => {
  const isLoading = useAtomValue(globalLoadingAtom);
  const message = useAtomValue(globalLoadingMessageAtom);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/40 text-white backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* TODO: 추후 시간이 된다면 스켈레톤 UI도 구현할 것. 아래는 예시 */}
          {/* <div className="w-[300px] animate-pulse space-y-3 rounded-md bg-white p-6 text-black shadow-md">
            <div className="h-4 w-3/4 rounded bg-gray-300" />
            <div className="h-4 w-full rounded bg-gray-300" />
            <div className="h-4 w-5/6 rounded bg-gray-300" />
          </div> */}

          <LoadingSpinner />

          {/* 메시지 */}
          {message && <p className="text-opacity-90 text-sm text-white">{message}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoading;
