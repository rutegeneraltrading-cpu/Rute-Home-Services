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
        <div className="flex flex-col md:gap-8 gap-4 justify-center md:px-12 md:py-12 px-2 pt-10">
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
