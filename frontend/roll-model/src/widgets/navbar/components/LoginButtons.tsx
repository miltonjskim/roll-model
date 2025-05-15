'use client';

import { Button } from '@/components/ui/button';
import { socialLogin } from '@/features/auth/service/socialLogin';
import GoogleIcon from '@/shared/assets/images/google.svg';
import GithubIcon from '@/shared/assets/images/github.svg';

interface LoginButtonsProps {
  type?: 'modal';
}

const LoginButtons = ({ type }: LoginButtonsProps) => {
  const isModal = type === 'modal';

  const buttonClassName = isModal
    ? 'w-full bg-[theme(primary-white)] border border-[var(--color-gray-03)] text-[var(--primary-black)] hover:bg-[theme(primary-black)] hover:text-[var(--primary-white)] hover:border-[var(--primary-black)]'
    : 'w-full hover:bg-[theme(primary-black)] hover:text-[var(--primary-white)] ';

  const variant = 'outline';

  const ButtonItem = ({ provider, label, Icon }: { provider: 'google' | 'github'; label: string; Icon: typeof GoogleIcon }) => (
    <Button variant={variant} size={isModal ? 'lg' : 'default'} className={`group ${buttonClassName}`} onClick={() => socialLogin(provider)}>
      <div className="flex items-center gap-2">
        <Icon className="fill-current" />
        {label}
      </div>
    </Button>
  );

  return (
    <div className={isModal ? 'flex gap-2' : 'flex flex-col gap-2'}>
      <ButtonItem provider="google" label="구글로 로그인" Icon={GoogleIcon} />
      <ButtonItem provider="github" label="깃허브로 로그인" Icon={GithubIcon} />
    </div>
  );
};

export default LoginButtons;
