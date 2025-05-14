'use client';

import Link from 'next/link';

const links = [
  { label: 'Guide', href: '/guide' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Open Source', href: '/open-source' },
  { label: 'Workspace', href: '/workspace' },
];

const NavLinks = () => (
  <div className="text-md space-x-20 text-[var(--color-gray-01)]">
    {links.map(({ label, href }) => (
      <Link
        key={href}
        href={href}
        className="border-b-[var(--color-blue-01)] transition-all duration-300 select-none hover:w-full hover:border-b-[2px] hover:text-[1.125rem] hover:font-semibold hover:text-[var(--primary-black)]"
      >
        {label}
      </Link>
    ))}
  </div>
);

export default NavLinks;
