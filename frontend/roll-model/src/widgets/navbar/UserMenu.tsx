'use client';

import { useAtom, useSetAtom } from 'jotai';
import { isLoggedInAtom, userAtom, userToken } from '@/features/auth/model/authAtoms';
import Image from 'next/image';
import UserInfoPanel from '@/widgets/navbar/components/UserInfoPanel';
import LoginButtons from '@/widgets/navbar/components/LoginButtons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-[theme(color-gray-01)] grid aspect-square w-10 cursor-pointer place-items-center rounded-full">
            {isLoggedIn && user ? <Image src="/profile_image.svg" alt="user profile image" width={40} height={40} /> : <p className="font-tossface cursor-pointer">❔</p>}
          </div>
        </TooltipTrigger>

        <TooltipContent side="bottom" align="end" className="bg-[theme(primary-black)] z-50 w-64 rounded-md p-4 text-[var(--primary-white)] opacity-95 shadow-md">
          {isLoggedIn && user ? <UserInfoPanel user={user} onLogout={handleLogout} /> : <LoginButtons />}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserMenu;
