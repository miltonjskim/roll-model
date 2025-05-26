'use client';

import LoginRequiredDialog from '@/features/auth/ui/LoginRequiredDialog';

const LoginPage = () => {
  return (
    <div>
      <LoginRequiredDialog />
      <div className="mt-4">{/* 로그인 폼 */}</div>
    </div>
  );
};

export default LoginPage;
