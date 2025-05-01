import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/app/providers/AppProvider";
import { Toaster } from "sonner";
import Navbar from "@/widgets/Navbar";

export const metadata: Metadata = {
  title: "Roll model",
  description: "GUI 기반 간편 AI 모델 학습 호스팅 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[theme(color-background)]">
        <AppProvider>
          <Navbar />
          <div className="w-[90vw] mx-auto rounded-md p-4">{children}</div>
          <Toaster richColors position="top-center" />
        </AppProvider>
      </body>
    </html>
  );
}
