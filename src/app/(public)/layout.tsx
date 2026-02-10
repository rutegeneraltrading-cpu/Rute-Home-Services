import PublicNavbar from '@/components/common/PublicNavbar';
import PublicFooter from '@/components/common/PublicFooter';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PublicNavbar />
        <div className="min-h-screen">{children}</div>
        <PublicFooter />
      </body>
    </html>
  );
}
