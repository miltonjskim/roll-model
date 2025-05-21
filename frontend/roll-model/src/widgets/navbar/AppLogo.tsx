'use client';

import Image from 'next/image';
import Link from 'next/link';

interface AppLogoProps {
  isHome: boolean;
}
const AppLogo = ({ isHome }: AppLogoProps) => {
  return (
    <Link href="/" className="hover:text-[var(--primary-black)]">
      <Image src="/logo.svg" alt="logo" width={120} height={40} />
    </Link>
  );
};

export default AppLogo;
