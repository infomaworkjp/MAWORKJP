import './globals.css';
import React from 'react';

export const metadata = {
  title: 'M-A Work JP 業務管理システム',
  description: '翻訳・通訳業務の顧客管理・案件管理・証拠保管システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
