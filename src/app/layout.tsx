import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/client/providers';
import { Toaster } from '@/components/ui';
import 'react-phone-input-2/lib/style.css';
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
        <Toaster />
      </body>
    </html>
  );
}
