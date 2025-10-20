import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Prismodul - ERP System',
  description: 'Prishanteringssystem för ERP',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">{children}</body>
    </html>
  );
}
