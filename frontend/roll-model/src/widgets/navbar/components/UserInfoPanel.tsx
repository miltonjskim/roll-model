'use client';

import { Button } from '@/components/ui/button';
import { UserInfo } from '@/features/auth/model/authAtoms';
import Image from 'next/image';
import GoogleIcon from '@/shared/assets/images/google.svg';
import GithubIcon from '@/shared/assets/images/github.svg';

interface Props {
  user: UserInfo;
  onLogout: () => void;
}

const UserInfoPanel = ({ user, onLogout }: Props) => {
  const renderProviderIcon = () => {
    if (user.provider === 'google') {
      return <GoogleIcon className="fill-current" />;
    } else if (user.provider === 'github') {
      return <GithubIcon className="fill-current" />;
    }
    return null;
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {renderProviderIcon()}
          <span className="text-sm">{user.provider} 로그인</span>
        </div>
        <Button variant="outline" className="bg-[theme(color-gray-02)] rounded-sm p-2" onClick={onLogout} size="sm">
          로그아웃
        </Button>
      </div>
      <hr className="my-2 border-t border-[var(--color-gray-02)] opacity-30" />
      <p className="font-semibold">{user.nickname}</p>
      <p className="text-sm">{user.email}</p>
    </div>
  );
};

export default UserInfoPanel;
