import type { Metadata } from 'next';
import { PublicNavbar, PublicFooter } from '@/components/common';
import { CartProvider } from '@/lib/contexts';
import { ROOT_METADATA } from '@/lib/seo';

export const metadata: Metadata = ROOT_METADATA;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <PublicNavbar />
          <div style={{ minHeight: 'calc(100vh - 100px)' }}>{children}</div>
          <PublicFooter />
        </CartProvider>
      </body>
    </html>
  );
}
