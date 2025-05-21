'use client';

import clsx from 'clsx';
import Link from 'next/link';

const links = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Open Source', href: '/open-source' },
  { label: 'Workspace', href: '/workspace' },
];

interface NavLinksProps {
  isHome: boolean;
}

const NavLinks = ({ isHome }: NavLinksProps) => {
  return (
    <div className="text-md space-x-20 text-[var(--color-gray-01)] transition-all duration-300 group-hover:text-lg">
      {links.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            'border-b-[var(--color-blue-01)] text-sm transition-all duration-300 select-none',
            'group-hover:text-lg',
            'hover:border-b-[2px] hover:text-[1.125rem] hover:font-semibold hover:text-[var(--primary-black)]',
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
};

export default NavLinks;
