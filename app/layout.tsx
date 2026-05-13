import type { Metadata } from "next";
import { M_PLUS_1 } from "next/font/google";
import "./globals.css";

const mPlus = M_PLUS_1({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "MS",
  description: "MS管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={mPlus.className}>{children}</body>
    </html>
  );
}
