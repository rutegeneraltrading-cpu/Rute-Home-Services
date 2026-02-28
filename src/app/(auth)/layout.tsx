'use client';

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col gap-8 justify-center p-12">
          <Link
            href="/"
            className="text-2xl font-bold text-center lg:text-left"
          >
            RUTE<span className="text-green-600">.</span>
          </Link>
          <div className="flex items-center justify-center">{children}</div>
        </div>
      </body>
    </html>
  );
}
