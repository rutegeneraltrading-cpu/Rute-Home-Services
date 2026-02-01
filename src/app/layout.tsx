import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/client/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Home Services',
  description: 'Professional home services platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
