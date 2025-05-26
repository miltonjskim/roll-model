import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/app/providers/AppProvider';
import { Toaster } from 'sonner';
import Navbar from '@/widgets/navbar/Navbar';
import ClientFCMInitializer from '@/app/providers/ClientFCMInitializer';
import FcmCatStatus from '@/widgets/fcmCat/FcmCatStatus';
import GlobalLoading from '@/shared/ui/GlobalLoading';
import 'shepherd.js/dist/css/shepherd.css';

export const metadata: Metadata = {
  title: 'Roll model',
  description: 'GUI 기반 간편 AI 모델 학습 호스팅 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link href="https://cdn.jsdelivr.net/gh/toss/tossface/dist/tossface.css" rel="stylesheet" type="text/css" />
      </head>
      <body className="to-[theme(primary-white)] flex min-h-screen flex-col bg-gradient-to-b from-transparent">
        <AppProvider>
          <ClientFCMInitializer />
          <header className="group h-12 transition-all duration-300 hover:h-20">
            <Navbar />
          </header>
          <main className="flex flex-1 items-center justify-center">
            <div className="w-full rounded-md text-center">
              <GlobalLoading />
              {children}
            </div>
          </main>

          <FcmCatStatus />
          <Toaster richColors position="top-center" />
        </AppProvider>
      </body>
    </html>
  );
}
