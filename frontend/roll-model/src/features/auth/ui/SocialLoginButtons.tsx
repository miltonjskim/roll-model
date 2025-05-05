'use client';

import { useSetAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { accessTokenAtom, refreshTokenAtom } from '@/features/auth/model/authAtoms';
import { socialLogin } from '@/features/auth/service/socialLogin';

export const SocialLoginButtons = () => {
	const handleLogin = (provider: "google" | "github") => {
		socialLogin(provider);
	};

  return (
    <div className="flex flex-col gap-4">
      <Button variant="black" onClick={() => handleLogin('google')}>
        구글로 로그인
      </Button>
      <Button variant="black" onClick={() => handleLogin('github')}>
        깃허브로 로그인
      </Button>
    </div>
  );
};
