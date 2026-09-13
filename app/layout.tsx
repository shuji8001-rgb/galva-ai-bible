import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '溶融亜鉛めっき技術伝承AIバイブル | 品管特化ナレッジベース',
  description: '品管担当者とベテラン職人の暗黙知を極小負荷で構造化・蓄積する対話型ナレッジWebシステム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
