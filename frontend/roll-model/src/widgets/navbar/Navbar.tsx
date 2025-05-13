'use client';

import AppLogo from '@/widgets/navbar/AppLogo';
import NavLinks from '@/widgets/navbar/NavLinks';
import UserMenu from '@/widgets/navbar/UserMenu';

const Navbar = () => {
  return (
    <nav className="flex min-w-[90vw] basis-[90vw] items-center justify-between px-24 pt-8">
      <AppLogo />
      <NavLinks />
      <UserMenu />
    </nav>
  );
};

export default Navbar;
