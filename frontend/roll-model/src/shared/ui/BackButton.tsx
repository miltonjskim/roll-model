'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'lg' | 'sm' | 'icon';
  variant?: 'black' | 'outline';
}

const BackButton = ({ children, className, size, variant }: BackButtonProps) => {
  const router = useRouter();

  return (
    <Button className={className} size={size} variant={variant ? variant : 'outline'} onClick={() => router.back()}>
      {children}
    </Button>
  );
};

export default BackButton;
