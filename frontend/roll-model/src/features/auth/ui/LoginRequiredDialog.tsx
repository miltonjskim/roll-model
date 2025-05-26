'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isLoggedInAtom } from '@/features/auth/model/authAtoms';
import LoginButtons from '@/widgets/navbar/components/LoginButtons';
import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const LoginRequiredDialog = () => {
  const router = useRouter();
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showModal = urlParams.get('modal') === 'login-required';
    setOpen(showModal);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setOpen(false);
      router.replace('/');
    }
  }, [isLoggedIn, router]);

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      router.replace('/');
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="bg-[theme(primary-white)] animate-in fade-in duration-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">로그인이 필요해요</DialogTitle>
          <DialogDescription>
            <p className="mb-4 text-sm text-[color:var(--color-gray-01)]">
              해당 페이지를 사용하려면 로그인이 필요합니다.
              <br />
              아래 소셜 계정으로 로그인해주세요.
            </p>
            <LoginButtons type="modal" />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default LoginRequiredDialog;
