'use client';

import { Button } from '@/components/ui/button';
import { isLoggedInAtom, userAtom, userToken } from '@/features/auth/model/authAtoms';
import { socialLogin } from '@/features/auth/service/socialLogin';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Image from 'next/image';
import Link from 'next/link';
import GoogleIcon from '@/shared/assets/images/google.svg';
import GithubIcon from '@/shared/assets/images/github.svg';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [user, setUser] = useAtom(userAtom);
  const setUserToken = useSetAtom(userToken);

  const handleLogout = () => {
    sessionStorage.removeItem('token');

    setIsLoggedIn(false);
    setUser(null);
    setUserToken('');
  };

  const handleLogin = (provider: 'google' | 'github') => {
    socialLogin(provider);
  };

  console.log('isLoggedIn:', isLoggedIn);

  return (
    <nav className="flex min-w-[90vw] basis-[90vw] items-center justify-between px-24 py-8">
      <div>
        <Link href="/" className="hover:text-[var(--primary-black)]">
          <Image src="/logo.svg" alt="logo" width={120} height={40} />
        </Link>
      </div>
      <div className="text-md space-x-20 text-[var(--color-gray-01)]">
        <Link
          href="/guide"
          className="border-b-[var(--color-blue-01)] transition-all duration-300 hover:w-full hover:border-b-[2px] hover:text-[1.125rem] hover:font-semibold hover:text-[var(--primary-black)]"
        >
          Guide
        </Link>
        <Link
          href="/dashboard"
          className="border-b-[var(--color-blue-01)] transition-all duration-300 hover:w-full hover:border-b-[2px] hover:text-[1.125rem] hover:font-semibold hover:text-[var(--primary-black)]"
        >
          Dashboard
        </Link>
        <Link
          href="/open-source"
          className="border-b-[var(--color-blue-01)] transition-all duration-300 hover:w-full hover:border-b-[2px] hover:text-[1.125rem] hover:font-semibold hover:text-[var(--primary-black)]"
        >
          Open Source
        </Link>
        <Link
          href="/workspace"
          className="border-b-[var(--color-blue-01)] transition-all duration-300 hover:w-full hover:border-b-[2px] hover:text-[1.125rem] hover:font-semibold hover:text-[var(--primary-black)]"
        >
          Workspace
        </Link>
      </div>

      <div>
        {isLoggedIn && user ? (
          // 로그인 했을 때
          <div className="bg-[theme(color-gray-01)] grid aspect-square w-10 place-items-center rounded-full">
            <Image src="/profile_image.svg" alt="user profile image" width={40} height={40} />
          </div>
        ) : (
          // 로그인 X
          // <div className="bg-[theme(color-gray-01)] grid aspect-square w-10 place-items-center rounded-full">
          //   <p className="font-tossface">❔</p>
          // </div>
          <div className="relative">
            <div className="flex items-center gap-1">
              <div className="group relative">
                {/* 프로필 이미지 */}
                <div className="bg-[theme(color-gray-01)] grid aspect-square w-10 place-items-center rounded-full">
                  <Image src="/profile_image.svg" alt="user profile image" width={40} height={40} className="cursor-pointer" />
                </div>

                {/* 로그인했을 때 유저 정보 팝업 */}
                <div className="bg-[theme(primary-black)] absolute top-11 right-0 z-10 hidden w-56 rounded-sm border border-[var(--color-gray-02)] p-4 text-[var(--primary-white)] opacity-90 shadow-md transition-transform duration-200 group-hover:block group-hover:scale-[1.01] hover:block">
                  {isLoggedIn && user ? (
                    <div>
                      {user?.provider === 'google' && (
                        <div className="flex items-center gap-2">
                          <Image src="/google.svg" alt="구글 로그인" width={30} height={30} />
                          <span>google</span>
                        </div>
                      )}

                      {user?.provider === 'github' && (
                        <div className="flex items-center gap-2">
                          <Image src="/github.svg" alt="깃허브 로그인" width={30} height={30} />
                          <span>github</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Image src="/google.svg" alt="구글 로그인" width={30} height={30} />
                          <span>google</span>
                        </div>
                        <div>
                          <Button variant="outline" className="bg-[theme(color-gray-02)] rounded-sm" onClick={handleLogout} size="sm">
                            로그아웃
                          </Button>
                        </div>
                      </div>
                      <hr className="my-2 border-t border-[var(--color-gray-02)] opacity-30" />
                      <p className="font-semibold">{user?.nickname}</p>
                      <p className="text-sm">{user?.email}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button className="hover:bg-[theme(primary-black)] w-full hover:text-[var(--primary-white)]" variant="outline" onClick={() => handleLogin('google')}>
                        <div className="group m-2 flex items-center gap-2">
                          <GoogleIcon className="fill-current" />
                          구글로 로그인
                        </div>
                      </Button>
                      <Button variant="outline" className="group hover:bg-[theme(primary-black)] w-full hover:text-[var(--primary-white)]" onClick={() => handleLogin('github')}>
                        <div className="flex items-center gap-2">
                          <GithubIcon className="fill-current" />
                          깃허브로 로그인
                        </div>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
