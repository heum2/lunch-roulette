import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { cn } from '@/utils/style';

export const metadata: Metadata = {
  title: '점심 룰렛',
  description: '점심시간 메뉴를 고르기 힘들 때 사용하는 룰렛',
};

export const pretendard = localFont({
  src: [
    {
      path: '../../public/fonts/Pretendard-Thin.woff',
      weight: '100',
    },
    {
      path: '../../public/fonts/Pretendard-ExtraLight.woff',
      weight: '200',
    },
    {
      path: '../../public/fonts/Pretendard-Light.woff',
      weight: '300',
    },
    {
      path: '../../public/fonts/Pretendard-Regular.woff',
      weight: '400',
    },
    {
      path: '../../public/fonts/Pretendard-Medium.woff',
      weight: '500',
    },
    {
      path: '../../public/fonts/Pretendard-SemiBold.woff',
      weight: '600',
    },
    {
      path: '../../public/fonts/Pretendard-Bold.woff',
      weight: '700',
    },
    {
      path: '../../public/fonts/Pretendard-ExtraBold.woff',
      weight: '800',
    },
    {
      path: '../../public/fonts/Pretendard-Black.woff',
      weight: '900',
    },
  ],
  display: 'swap',
  variable: '--font-pretendard',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={cn(pretendard.className, 'h-dvh')}>{children}</body>
    </html>
  );
}
