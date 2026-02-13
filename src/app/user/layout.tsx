'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedLayout } from '@/components/admin';
import { UserSidebar } from '@/components/user';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = useMemo(() => {
    if (!pathname) return 'User';

    const map: Array<{ path: string; title: string }> = [
      { path: '/user/dashboard', title: 'Dashboard' },
      { path: '/user/bookings', title: 'Bookings' },
      { path: '/user/orders', title: 'Orders' },
      { path: '/user/payment-history', title: 'Payment History' },
      { path: '/user/notifications', title: 'Notifications' },
      { path: '/user/profile', title: 'Profile' },
    ];

    if (pathname === '/user') return 'Dashboard';

    const match = map.find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    );
    return match?.title ?? 'User';
  }, [pathname]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(!event.matches);
    };
    onChange(mql);
    mql.addEventListener(
      'change',
      onChange as (event: MediaQueryListEvent) => void,
    );
    return () =>
      mql.removeEventListener(
        'change',
        onChange as (event: MediaQueryListEvent) => void,
      );
  }, []);

  return (
    <ProtectedLayout>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <UserSidebar />
        <SidebarInset>
          <header className="fixed flex h-15.25 items-center gap-2 border-b w-full px-4 bg-white z-50">
            <SidebarTrigger className="mr-2" />
            <span className="text-base font-medium text-muted-foreground">
              {pageTitle}
            </span>
          </header>
          <main className="flex-1 px-6 py-20">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  );
}
