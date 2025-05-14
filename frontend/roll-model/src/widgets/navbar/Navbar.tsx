'use client';

import AppLogo from '@/widgets/navbar/AppLogo';
import NavLinks from '@/widgets/navbar/NavLinks';
import UserMenu from '@/widgets/navbar/UserMenu';

const Navbar = () => {
  return (
    <nav className="flex w-full items-center justify-between px-24 pt-6">
      <AppLogo />
      <NavLinks />
      <UserMenu />
    </nav>
  );
};

export default Navbar;
