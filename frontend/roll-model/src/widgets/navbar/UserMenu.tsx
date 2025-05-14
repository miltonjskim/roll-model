'use client';

import { useAtom, useSetAtom } from 'jotai';
import { isLoggedInAtom, userAtom, userToken } from '@/features/auth/model/authAtoms';
import Image from 'next/image';
import UserInfoPanel from '@/widgets/navbar/components/UserInfoPanel';
import LoginButtons from '@/widgets/navbar/components/LoginButtons';

const UserMenu = () => {
  const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [user, setUser] = useAtom(userAtom);
  const setUserToken = useSetAtom(userToken);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setUserToken('');
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 select-none">
        <div className="group relative">
          {/* 프로필 이미지 부분 */}
          <div className="bg-[theme(color-gray-01)] grid aspect-square w-10 cursor-pointer place-items-center rounded-full">
            {isLoggedIn && user ? <Image src="/profile_image.svg" alt="user profile image" width={40} height={40} /> : <p className="font-tossface cursor-pointer">❔</p>}
          </div>

          {/* 팝업 부분 */}
          <div className="bg-[theme(primary-black)] absolute top-10 right-0 z-10 hidden w-64 rounded-md border border-[var(--color-gray-02)] p-4 text-[var(--primary-white)] opacity-90 shadow-md transition-transform duration-200 group-hover:block group-hover:scale-[1.01] hover:block">
            {isLoggedIn && user ? <UserInfoPanel user={user} onLogout={handleLogout} /> : <LoginButtons />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMenu;
