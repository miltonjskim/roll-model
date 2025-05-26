'use client';

import AppLogo from '@/widgets/navbar/AppLogo';
import NavLinks from '@/widgets/navbar/NavLinks';
import UserMenu from '@/widgets/navbar/UserMenu';
import { useParams, usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  const isHome = pathname === '/';
  return (
    <nav className={`flex h-full w-full items-center justify-between px-24 py-4 transition-all duration-300 group-hover:py-8`}>
      <AppLogo isHome={isHome} />
      <NavLinks isHome={isHome} />
      <UserMenu />
    </nav>
  );
};

export default Navbar;
