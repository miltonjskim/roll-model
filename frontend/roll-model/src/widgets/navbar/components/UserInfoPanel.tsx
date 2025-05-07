'use client';

import { Button } from '@/components/ui/button';
import { UserInfo } from '@/features/auth/model/authAtoms';
import Image from 'next/image';

interface Props {
  user: UserInfo;
  onLogout: () => void;
}

const UserInfoPanel = ({ user, onLogout }: Props) => (
  <div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Image src={`/${user.provider}.svg`} alt={`${user.provider} 로그인`} width={30} height={30} />
        <span>{user.provider}</span>
      </div>
      <Button variant="outline" className="bg-[theme(color-gray-02)] rounded-sm" onClick={onLogout} size="sm">
        로그아웃
      </Button>
    </div>
    <hr className="my-2 border-t border-[var(--color-gray-02)] opacity-30" />
    <p className="font-semibold">{user.nickname}</p>
    <p className="text-sm">{user.email}</p>
  </div>
);

export default UserInfoPanel;
