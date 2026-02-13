import { PublicNavbar, PublicFooter } from '@/components/common';
import { CartProvider } from '@/lib/contexts';

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
          {children}
          <PublicFooter />
        </CartProvider>
      </body>
    </html>
  );
}
