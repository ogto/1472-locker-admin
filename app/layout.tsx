import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "빵다방 Admin",
  description: "빵다방 관리자 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/static/woff2/SUIT.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}