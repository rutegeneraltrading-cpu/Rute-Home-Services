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
        <div>
          <div className="lg:relative flex lg:flex-row flex-col min-h-screen items-center justify-center bg-slate-50 px-4">
            <Link
              href="/"
              className="lg:absolute top-8 left-8 text-2xl font-bold text-center lg:text-left w-full lg:w-auto"
            >
              RUTE<span className="text-green-600">.</span>
            </Link>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
