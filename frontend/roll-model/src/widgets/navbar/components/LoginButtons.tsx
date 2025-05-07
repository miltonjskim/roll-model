'use client';

import { Button } from '@/components/ui/button';
import { socialLogin } from '@/features/auth/service/socialLogin';
import GoogleIcon from '@/shared/assets/images/google.svg';
import GithubIcon from '@/shared/assets/images/github.svg';

const LoginButtons = () => (
  <div className="flex flex-col gap-2">
    <Button className="hover:bg-[theme(primary-black)] w-full hover:text-[var(--primary-white)]" variant="outline" onClick={() => socialLogin('google')}>
      <div className="group m-2 flex items-center gap-2">
        <GoogleIcon className="fill-current" />
        구글로 로그인
      </div>
    </Button>
    <Button variant="outline" className="group hover:bg-[theme(primary-black)] w-full hover:text-[var(--primary-white)]" onClick={() => socialLogin('github')}>
      <div className="flex items-center gap-2">
        <GithubIcon className="fill-current" />
        깃허브로 로그인
      </div>
    </Button>
  </div>
);

export default LoginButtons;
