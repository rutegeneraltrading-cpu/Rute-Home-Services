import PublicNavbar from '@/components/common/PublicNavbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PublicNavbar />
        {children}
      </body>
    </html>
  );
}
