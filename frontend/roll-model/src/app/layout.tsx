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
      <body className="bg-[theme(color-background)] flex min-h-screen flex-col">
        <AppProvider>
          <ClientFCMInitializer />
          <header className="h-20">
            <Navbar />
          </header>
          <main className="flex flex-1 items-center justify-center px-4">
            <div className="w-full max-w-[80vw] rounded-md text-center">
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
