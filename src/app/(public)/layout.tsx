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
          <div className="min-h-screen">{children}</div>
          <PublicFooter />
        </CartProvider>
      </body>
    </html>
  );
}
